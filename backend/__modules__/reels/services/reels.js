const db = require('../../../models')
const ApiError = require('../../../exceptions/api-error')

const VIDEO_INCLUDE = { model: db.Media, as: 'video',     attributes: ['id', 'url', 'mime_type', 'size'] }
const THUMB_INCLUDE = { model: db.Media, as: 'thumbnail', attributes: ['id', 'url', 'thumbnail_url'] }
const SHOP_INCLUDE  = { model: db.Shop,  as: 'shop',      attributes: ['id', 'name', 'logo'] }
const PROD_INCLUDE  = { model: db.Product, as: 'product', attributes: ['id', 'name', 'price', 'currency'], required: false }

function shopIncludeFor(cityId, attributes) {
    if (!cityId) return attributes ? { ...SHOP_INCLUDE, attributes } : SHOP_INCLUDE
    return { ...SHOP_INCLUDE, where: { city_id: cityId }, ...(attributes ? { attributes } : {}) }
}

const SORT_MAP = {
    newest:  [['createdAt',  'DESC']],
    oldest:  [['createdAt',  'ASC']],
    popular: [['view_count', 'DESC'], ['createdAt', 'DESC']],
}

function resolveSort(param) {
    return SORT_MAP[param] ?? SORT_MAP.newest
}

class ReelService {
    static async get(filter = {}, limit = 20, skip = 0, sort = 'newest', cityId = null) {
        return db.Reel.findAll({
            where: filter,
            limit,
            offset: skip,
            order: resolveSort(sort),
            include: [VIDEO_INCLUDE, THUMB_INCLUDE, shopIncludeFor(cityId), PROD_INCLUDE],
        })
    }

    static async getCount(filter = {}, cityId = null) {
        if (!cityId) return db.Reel.count({ where: filter })
        return db.Reel.count({ where: filter, include: [shopIncludeFor(cityId, [])] })
    }

    static async getById(id, paranoid = true) {
        if (!id) return null
        return db.Reel.findOne({
            where: { id },
            paranoid,
            include: [VIDEO_INCLUDE, THUMB_INCLUDE, SHOP_INCLUDE, PROD_INCLUDE],
        })
    }

    static async create({ shop_id, video_id, thumbnail_id, caption, product_id, moderation_status }) {
        return db.Reel.create({ shop_id, video_id, thumbnail_id, caption, product_id, moderation_status })
    }

    static async update(id, { thumbnail_id, caption, product_id, is_active }) {
        return db.Reel.update(
            { thumbnail_id, caption, product_id, is_active },
            { where: { id } }
        )
    }

    static async recordView(reelId, userId) {
        if (!userId) return db.Reel.increment('view_count', { where: { id: reelId } })

        const [, created] = await db.ReelView.findOrCreate({
            where: { user_id: userId, reel_id: reelId },
            defaults: { user_id: userId, reel_id: reelId },
        })
        if (created) await db.Reel.increment('view_count', { where: { id: reelId } })
        return { created }
    }

    static async incrementShares(id) {
        return db.Reel.increment('share_count', { where: { id } })
    }

    static async delete(id, force = false) {
        return db.Reel.destroy({ where: { id }, force })
    }

    // ── Moderation ───────────────────────────────────────────────────────────────

    static async approve(id, userId) {
        await db.Reel.update(
            { moderation_status: 1, moderated_by: userId, moderated_at: new Date(), moderation_note: null },
            { where: { id } }
        )
        return this.getById(id)
    }

    static async reject(id, userId, note) {
        await db.Reel.update(
            { moderation_status: 2, moderated_by: userId, moderated_at: new Date(), moderation_note: note || null },
            { where: { id } }
        )
        return this.getById(id)
    }

    // ── Likes ────────────────────────────────────────────────────────────────────

    static async like(userId, reelId) {
        const reel = await db.Reel.findOne({ where: { id: reelId, is_active: true, moderation_status: 1 } })
        if (!reel) throw ApiError.NotFound('Reel tapylmady')

        const [, created] = await db.ReelLike.findOrCreate({
            where: { user_id: userId, reel_id: reelId },
            defaults: { user_id: userId, reel_id: reelId },
        })
        if (created) await db.Reel.increment('like_count', { where: { id: reelId } })
        return { created }
    }

    static async unlike(userId, reelId) {
        const deleted = await db.ReelLike.destroy({ where: { user_id: userId, reel_id: reelId } })
        if (!deleted) throw ApiError.NotFound('Like tapylmady')
        await db.Reel.decrement('like_count', { where: { id: reelId } })
        return { deleted: true }
    }
}

module.exports = ReelService
