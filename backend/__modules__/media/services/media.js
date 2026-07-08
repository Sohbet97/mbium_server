const path = require('path')   // kept for path.extname
const { v4: uuidv4 } = require('uuid')
const { Op } = require('sequelize')
const db = require('../../../models')
const { resolveType } = require('../../../utils/upload')
const { uploadBuffer, deleteFile, urlToPath } = require('../../../utils/firebase')

let sharp
try { sharp = require('sharp') } catch { sharp = null }

// ── Core CRUD ─────────────────────────────────────────────────────────────────
async function processUpload(file, userId, mediaTypeOverride) {
    const rawType = resolveType(file.mimetype, file.originalname)
    if (!rawType) throw new Error(`Unsupported file type: ${file.mimetype}`)

    const type = mediaTypeOverride === '360' && rawType === 'image' ? '360' : rawType
    const sub  = type === 'video' ? 'videos' : type === '3d' ? '3d' : type === '360' ? '360' : 'images'

    const ext      = path.extname(file.originalname).toLowerCase()
    const filename = `${uuidv4()}${ext}`
    const destPath = `media/${sub}/${filename}`

    const url = await uploadBuffer(file.buffer, destPath, file.mimetype)

    let thumbnail_url = null
    let width = null, height = null

    if ((type === 'image' || type === '360') && sharp) {
        try {
            const meta = await sharp(file.buffer).metadata()
            width  = meta.width  || null
            height = meta.height || null

            const thumbBuffer = await sharp(file.buffer)
                .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 75 })
                .toBuffer()

            const thumbPath = `media/thumbs/thumb_${uuidv4()}.webp`
            thumbnail_url = await uploadBuffer(thumbBuffer, thumbPath, 'image/webp')
        } catch (e) {
            console.error('[media] thumb error:', e.message)
        }
    }

    const media = await db.Media.create({
        filename,
        original_name: file.originalname,
        mime_type:     file.mimetype,
        size:          file.size,
        type,
        url,
        thumbnail_url,
        width,
        height,
        uploaded_by: userId || null,
    })

    return media
}

async function list({ type, search } = {}, limit = 40, skip = 0) {
    const where = {}
    if (type) where.type = type
    if (search) where.original_name = { [Op.iLike]: `%${search}%` }

    const { count, rows } = await db.Media.findAndCountAll({
        where,
        limit,
        offset: skip,
        order: [['createdAt', 'DESC']],
    })
    return { count, data: rows }
}

async function getById(id) {
    return db.Media.findByPk(id)
}

async function update(id, { alt_text }) {
    const m = await db.Media.findByPk(id)
    if (!m) throw new Error('Not found')
    return m.update({ alt_text })
}

async function remove(id) {
    const m = await db.Media.findByPk(id, { paranoid: false })
    if (!m) throw new Error('Not found')

    const toDelete = [m.url, m.thumbnail_url].filter(Boolean)
    await Promise.allSettled(toDelete.map((url) => deleteFile(urlToPath(url))))
    await m.destroy({ force: true })
}

// ── Product ↔ Media ───────────────────────────────────────────────────────────
// variantId: null (default) = shared/product-level media; a number = scoped to that ProductVariant.
async function attachToProduct(productId, mediaId, role = 'gallery', sortOrder = 0, variantId = null) {
    const [record] = await db.ProductMedia.findOrCreate({
        where: { product_id: productId, media_id: mediaId, variant_id: variantId },
        defaults: { role, sort_order: sortOrder },
    })
    if (role === 'primary') {
        // Demote other primaries within the same scope (product-shared, or this variant)
        await db.ProductMedia.update(
            { role: 'gallery' },
            { where: { product_id: productId, variant_id: variantId, role: 'primary', media_id: { [Op.ne]: mediaId } } }
        )
        await record.update({ role: 'primary' })
    }
    return record
}

async function updateProductMedia(productId, mediaId, { role, sort_order }, variantId = null) {
    const record = await db.ProductMedia.findOne({ where: { product_id: productId, media_id: mediaId, variant_id: variantId } })
    // Already detached/replaced (e.g. by AI spin regeneration mid-drag) — nothing to update.
    if (!record) return null
    const updates = {}
    if (role !== undefined) updates.role = role
    if (sort_order !== undefined) updates.sort_order = sort_order
    if (role === 'primary') {
        await db.ProductMedia.update(
            { role: 'gallery' },
            { where: { product_id: productId, variant_id: variantId, role: 'primary', media_id: { [Op.ne]: mediaId } } }
        )
    }
    return record.update(updates)
}

async function detachFromProduct(productId, mediaId, variantId = null) {
    return db.ProductMedia.destroy({ where: { product_id: productId, media_id: mediaId, variant_id: variantId } })
}

// variantId omitted → all media for the product (shared + every variant's), for a full overview.
// variantId === null → shared/product-level only. variantId === <id> → that variant's media only.
async function getProductMedia(productId, variantId) {
    const where = { product_id: productId }
    if (variantId !== undefined) where.variant_id = variantId
    return db.ProductMedia.findAll({
        where,
        include: [{ model: db.Media, as: 'media' }],
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
    })
}

module.exports = { processUpload, list, getById, update, remove, attachToProduct, updateProductMedia, detachFromProduct, getProductMedia }
