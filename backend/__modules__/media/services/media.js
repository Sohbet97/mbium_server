const path = require('path')
const fs = require('fs/promises')
const { Op } = require('sequelize')
const db = require('../../../models')
const { resolveType, MEDIA_BASE, ensureMediaDirs } = require('../../../utils/upload')

let sharp
try { sharp = require('sharp') } catch { sharp = null }

// ── Thumbnail generation ──────────────────────────────────────────────────────
async function generateThumb(filePath, filename) {
    if (!sharp) return null
    try {
        const thumbName = `thumb_${path.basename(filename, path.extname(filename))}.webp`
        const thumbPath = path.join(MEDIA_BASE, 'thumbs', thumbName)
        await sharp(filePath)
            .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 75 })
            .toFile(thumbPath)
        return `/media/thumbs/${thumbName}`
    } catch (e) {
        console.error('[media] thumb error:', e.message)
        return null
    }
}

async function getImageDimensions(filePath) {
    if (!sharp) return {}
    try {
        const meta = await sharp(filePath).metadata()
        return { width: meta.width || null, height: meta.height || null }
    } catch { return {} }
}

// ── Core CRUD ─────────────────────────────────────────────────────────────────
async function processUpload(file, userId, mediaTypeOverride) {
    ensureMediaDirs()
    const rawType = resolveType(file.mimetype, file.originalname)
    const type = mediaTypeOverride === '360' && rawType === 'image' ? '360' : rawType

    const sub = type === 'video' ? 'videos' : type === '3d' ? '3d' : type === '360' ? '360' : 'images'
    const url = `/media/${sub}/${file.filename}`

    let thumbnail_url = null
    let width = null, height = null

    if (type === 'image' || type === '360') {
        const dims = await getImageDimensions(file.path)
        width = dims.width
        height = dims.height
        thumbnail_url = await generateThumb(file.path, file.filename)
    }

    const media = await db.Media.create({
        filename: file.filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
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

    // Delete physical files
    const toDelete = [
        path.join(process.cwd(), m.url),
        m.thumbnail_url ? path.join(process.cwd(), m.thumbnail_url) : null,
    ].filter(Boolean)

    await Promise.allSettled(toDelete.map((p) => fs.unlink(p)))
    await m.destroy({ force: true })
}

// ── Product ↔ Media ───────────────────────────────────────────────────────────
async function attachToProduct(productId, mediaId, role = 'gallery', sortOrder = 0) {
    const [record] = await db.ProductMedia.findOrCreate({
        where: { product_id: productId, media_id: mediaId },
        defaults: { role, sort_order: sortOrder },
    })
    if (role === 'primary') {
        // Demote other primaries
        await db.ProductMedia.update(
            { role: 'gallery' },
            { where: { product_id: productId, role: 'primary', media_id: { [Op.ne]: mediaId } } }
        )
        await record.update({ role: 'primary' })
    }
    return record
}

async function updateProductMedia(productId, mediaId, { role, sort_order }) {
    const record = await db.ProductMedia.findOne({ where: { product_id: productId, media_id: mediaId } })
    if (!record) throw new Error('Not found')
    const updates = {}
    if (role !== undefined) updates.role = role
    if (sort_order !== undefined) updates.sort_order = sort_order
    if (role === 'primary') {
        await db.ProductMedia.update(
            { role: 'gallery' },
            { where: { product_id: productId, role: 'primary', media_id: { [require('sequelize').Op.ne]: mediaId } } }
        )
    }
    return record.update(updates)
}

async function detachFromProduct(productId, mediaId) {
    return db.ProductMedia.destroy({ where: { product_id: productId, media_id: mediaId } })
}

async function getProductMedia(productId) {
    return db.ProductMedia.findAll({
        where: { product_id: productId },
        include: [{ model: db.Media, as: 'media' }],
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
    })
}

module.exports = { processUpload, list, getById, update, remove, attachToProduct, updateProductMedia, detachFromProduct, getProductMedia }
