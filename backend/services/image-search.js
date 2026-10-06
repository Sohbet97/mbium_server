const axios = require('axios')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const ApiError = require('../exceptions/api-error')
const SearchService = require('./search')

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate'
const MAX_LABELS = 8
const MIN_SCORE  = 0.6

// Labels (English) describing the photo, best first. Key stays on the server.
async function detectLabels(buffer) {
    const key = process.env.GOOGLE_VISION_API_KEY
    if (!key) throw new ApiError(503, 'Surat boýunça gözleg wagtlaýyn elýeterli däl')

    let data
    try {
        const res = await axios.post(
            VISION_URL,
            { requests: [{
                image:    { content: buffer.toString('base64') },
                features: [{ type: 'LABEL_DETECTION', maxResults: 15 }],
            }] },
            { params: { key }, timeout: 15000 }
        )
        data = res.data?.responses?.[0]
    } catch (e) {
        console.error('[image-search] vision request failed:', e.response?.data?.error?.message || e.message)
        throw new ApiError(502, 'Suraty seljermek başa barmady')
    }

    if (data?.error) {
        console.error('[image-search] vision error:', data.error.message)
        throw new ApiError(502, 'Suraty seljermek başa barmady')
    }

    return (data?.labelAnnotations || [])
        .filter((l) => l.description && (l.score ?? 0) >= MIN_SCORE)
        .slice(0, MAX_LABELS)
        .map((l) => l.description)
}

const KEYWORD_PROMPT = (labels) => `You help search the product catalog of an online marketplace in Turkmenistan.
Look at the photo. Google Vision detected these labels: ${labels.join(', ')}.
Return ONLY JSON: {"primary": [...], "extra": [...]}
- "primary": the main product type, as short single search words in Turkmen (Latin script), Russian and English, plus common synonyms (e.g. for a dress: "köýnek", "платье", "dress"). 3-9 words.
- "extra": up to 6 other useful single words about the item (material, style, kind, colour) in the same three languages.
No generic words (photo, image, product, text, fashion, design). Lower case, no punctuation.`

const cleanWords = (arr) => [...new Set((Array.isArray(arr) ? arr : [])
    .map((w) => String(w).toLowerCase().trim())
    .filter((w) => w && w.length > 1 && w.length < 40))]

// Search keywords for the photo: Vision labels, expanded by Gemini into Turkmen / Russian / English
// product words. primary = the product type (a product must match one); extra = used for ranking.
// Falls back to the raw Vision labels when Gemini is unavailable.
async function detectKeywords(buffer, mimeType = 'image/jpeg') {
    const labels = await detectLabels(buffer)
    const fallback = { labels, primary: cleanWords(labels.slice(0, 3)), extra: cleanWords(labels.slice(3)) }
    if (!genAI || !labels.length) return fallback

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        })
        const result = await model.generateContent([
            { inlineData: { mimeType, data: buffer.toString('base64') } },
            KEYWORD_PROMPT(labels),
        ])
        const parsed = JSON.parse(result.response.text())
        const primary = cleanWords(parsed.primary)
        if (!primary.length) return fallback
        const extra = cleanWords(parsed.extra).filter((w) => !primary.includes(w))
        return { labels, primary, extra }
    } catch (e) {
        console.error('[image-search] keyword expansion failed:', e.message)
        return fallback
    }
}

// Same shape as the text search, plus the keywords that drove it
async function searchByImage(buffer, { page = 1, limit = 20, mimeType } = {}) {
    const { labels, primary, extra } = await detectKeywords(buffer, mimeType)
    const tsQuery = SearchService.buildTsQueryAny(primary)
    if (!tsQuery) return { products: [], categories: [], shops: [], query: '', labels, keywords: { primary, extra }, page, limit }

    const [products, categories] = await Promise.all([
        SearchService.searchProductsByKeywords(primary, extra, { limit, offset: (page - 1) * limit }),
        SearchService.searchCategories(tsQuery, { limit: 8 }),
    ])

    return { products, categories, shops: [], query: primary.join(' '), labels, keywords: { primary, extra }, page, limit }
}

module.exports = { searchByImage, detectLabels, detectKeywords }
