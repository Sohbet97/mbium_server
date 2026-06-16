const fs = require('fs')
const path = require('path')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const db = require('../../../models')
const MediaService = require('../../media/services/media')
const { urlToPath } = require('../../../utils/firebase')

const MEDIA_BASE = path.resolve(process.cwd(), 'storage', 'media')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const MIN_REFERENCES = 1
const MAX_REFERENCES = 4
const ALLOWED_FRAME_COUNTS = [12, 24, 36]

function anglePrompt(deg) {
    return `Product photo, studio lighting, pure white background, exact same product ` +
        `as the reference images, ${deg}° rotation from front. Maintain color, texture, ` +
        `and material fidelity. No shadows on background. Commercial product photography style.`
}

async function readMediaBuffer(media) {
    const relPath = urlToPath(media.url).replace(/^media\//, '')
    return fs.promises.readFile(path.join(MEDIA_BASE, relPath))
}

async function generateFrame(model, refParts, angleDeg) {
    const result = await model.generateContent([
        ...refParts,
        { text: anglePrompt(angleDeg) },
    ])
    const parts = result.response?.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p) => p.inlineData)
    if (!imagePart) throw new Error(`Gemini ${angleDeg}° kadry döretmedi`)
    return {
        buffer: Buffer.from(imagePart.inlineData.data, 'base64'),
        mimeType: imagePart.inlineData.mimeType || 'image/png',
    }
}

/**
 * Generate a 360° spin frame sequence from 1-4 reference photos and attach
 * them to the product as ProductMedia rows with role='spin', replacing any
 * previously generated/uploaded spin frames.
 */
async function generateSpinFrames(productId, referenceMediaIds, frameCount, userId) {
    if (!Array.isArray(referenceMediaIds) || referenceMediaIds.length < MIN_REFERENCES) {
        throw new Error(`Iň az ${MIN_REFERENCES} surat saýlaň`)
    }
    if (referenceMediaIds.length > MAX_REFERENCES) {
        throw new Error(`Iň köp ${MAX_REFERENCES} surat saýlap bolýar`)
    }
    if (!ALLOWED_FRAME_COUNTS.includes(frameCount)) {
        throw new Error(`Kadr sany ${ALLOWED_FRAME_COUNTS.join('/')} bolmaly`)
    }

    const refMedia = await db.Media.findAll({ where: { id: referenceMediaIds } })
    if (refMedia.length !== referenceMediaIds.length) {
        throw new Error('Salgylanma suratlaryň käbiri tapylmady')
    }

    const refParts = await Promise.all(refMedia.map(async (m) => ({
        inlineData: {
            mimeType: m.mime_type,
            data: (await readMediaBuffer(m)).toString('base64'),
        },
    })))

    // Replace any existing spin sequence
    const existing = await db.ProductMedia.findAll({ where: { product_id: productId, role: 'spin' } })
    for (const pm of existing) {
        await MediaService.detachFromProduct(productId, pm.media_id)
        await MediaService.remove(pm.media_id).catch(() => {})
    }

    // Nano Banana (flash-image) is significantly cheaper per frame than the Pro variant
    // and is sufficient quality for spin-frame generation.
    // responseModalities must include IMAGE or the model returns text only.
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-image',
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    })
    const step = 360 / frameCount

    for (let i = 0; i < frameCount; i++) {
        const angle = Math.round(i * step)
        const { buffer, mimeType } = await generateFrame(model, refParts, angle)
        const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg'
        const file = {
            buffer,
            originalname: `spin-${i}${ext}`,
            mimetype: mimeType,
            size: buffer.length,
        }
        const media = await MediaService.processUpload(file, userId)
        await MediaService.attachToProduct(productId, media.id, 'spin', i)
    }

    return MediaService.getProductMedia(productId)
}

module.exports = { generateSpinFrames, ALLOWED_FRAME_COUNTS, MIN_REFERENCES, MAX_REFERENCES }
