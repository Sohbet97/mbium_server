const path     = require('path')
const fs       = require('fs')
const { v4: uuidv4 } = require('uuid')
const axios    = require('axios')
const FormData = require('form-data')
const db       = require('../../../models')
const { uploadBuffer, deleteFile, urlToPath } = require('../../../utils/firebase')
const MediaService = require('./media')

let sharp
try { sharp = require('sharp') } catch { sharp = null }

const REMBG_URL  = process.env.REMBG_SERVICE_URL || 'http://localhost:8001'
const MEDIA_BASE = path.resolve(process.cwd(), 'storage', 'media')
const MAX_SIDE   = 1500

async function startRemoval(mediaId) {
    const media = await db.Media.findByPk(mediaId)
    if (!media) throw new Error('Media not found')

    const destPath    = urlToPath(media.url)              // "media/images/uuid.jpg"
    const relativePath = destPath.replace(/^media\//, '') // "images/uuid.jpg"
    let buffer = await fs.promises.readFile(path.join(MEDIA_BASE, relativePath))

    if (sharp) {
        const meta = await sharp(buffer).metadata()
        if ((meta.width || 0) > MAX_SIDE || (meta.height || 0) > MAX_SIDE) {
            buffer = await sharp(buffer)
                .rotate()
                .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
                .toBuffer()
        } else {
            buffer = await sharp(buffer).rotate().toBuffer()
        }
    }

    const fd = new FormData()
    fd.append('file', buffer, { filename: 'image.png', contentType: 'image/png' })

    let transparentBuffer
    try {
        const res = await axios.post(`${REMBG_URL}/api/remove`, fd, {
            headers: fd.getHeaders(),
            responseType: 'arraybuffer',
            timeout: 60_000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        })
        transparentBuffer = Buffer.from(res.data)
    } catch (e) {
        const msg = e.response?.data?.detail || e.message
        throw new Error(`Rembg service error: ${msg}`)
    }

    let whiteBuffer = transparentBuffer
    if (sharp) {
        whiteBuffer = await sharp(transparentBuffer)
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .png()
            .toBuffer()
    }

    const token = uuidv4()
    const [whiteUrl, transparentUrl] = await Promise.all([
        uploadBuffer(whiteBuffer,       `media/temp/${token}_white.png`,       'image/png'),
        uploadBuffer(transparentBuffer, `media/temp/${token}_transparent.png`, 'image/png'),
    ])

    return { token, whiteUrl, transparentUrl }
}

async function confirmRemoval({ token, productId, variantId = null, mediaId, action, variant }) {
    const chosen = variant === 'white' ? 'white' : 'transparent'
    const other  = variant === 'white' ? 'transparent' : 'white'

    const chosenTemp = `media/temp/${token}_${chosen}.png`
    const otherTemp  = `media/temp/${token}_${other}.png`

    const chosenPath = path.join(MEDIA_BASE, `temp/${token}_${chosen}.png`)
    const chosenBuffer = await fs.promises.readFile(chosenPath)

    const filename = `${uuidv4()}.png`
    const permUrl  = await uploadBuffer(chosenBuffer, `media/images/${filename}`, 'image/png')

    let thumbnail_url = null, width = null, height = null
    if (sharp) {
        const meta = await sharp(chosenBuffer).metadata()
        width  = meta.width  || null
        height = meta.height || null
        const thumbBuf = await sharp(chosenBuffer)
            .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer()
        thumbnail_url = await uploadBuffer(thumbBuf, `media/thumbs/thumb_${uuidv4()}.webp`, 'image/webp')
    }

    const newMedia = await db.Media.create({
        filename,
        original_name: `bg-removed-${filename}`,
        mime_type: 'image/png',
        size: chosenBuffer.length,
        type: 'image',
        url: permUrl,
        thumbnail_url,
        width,
        height,
    })

    if (action === 'replace') {
        const pm = await db.ProductMedia.findOne({
            where: { product_id: productId, variant_id: variantId, media_id: mediaId },
        })
        const role       = pm?.role       ?? 'gallery'
        const sort_order = pm?.sort_order ?? 0
        await MediaService.detachFromProduct(productId, mediaId, variantId)
        await MediaService.remove(mediaId).catch(() => {})
        await MediaService.attachToProduct(productId, newMedia.id, role, sort_order, variantId)
    } else {
        const all = await db.ProductMedia.findAll({
            where: { product_id: productId, variant_id: variantId },
            order: [['sort_order', 'ASC']],
        })
        const nextSort = all.length ? all[all.length - 1].sort_order + 1 : 0
        await MediaService.attachToProduct(productId, newMedia.id, 'gallery', nextSort, variantId)
    }

    await Promise.allSettled([deleteFile(chosenTemp), deleteFile(otherTemp)])
    return newMedia
}

async function rejectRemoval(token) {
    await Promise.allSettled([
        deleteFile(`media/temp/${token}_white.png`),
        deleteFile(`media/temp/${token}_transparent.png`),
    ])
}

module.exports = { startRemoval, confirmRemoval, rejectRemoval }
