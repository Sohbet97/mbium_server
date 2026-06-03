const db = require('../../../models')

const VIDEO_INCLUDE = { model: db.Media, as: 'video',     attributes: ['id', 'url', 'mime_type', 'size'] }
const THUMB_INCLUDE = { model: db.Media, as: 'thumbnail', attributes: ['id', 'url', 'thumbnail_url'] }
const SHOP_INCLUDE  = { model: db.Shop,  as: 'shop',      attributes: ['id', 'name', 'logo'] }
const PROD_INCLUDE  = { model: db.Product, as: 'product', attributes: ['id', 'name', 'price', 'currency'], required: false }

const SORT_MAP = {
    newest:  [['createdAt',  'DESC']],
    oldest:  [['createdAt',  'ASC']],
    popular: [['view_count', 'DESC'], ['createdAt', 'DESC']],
}

function resolveSort(param) {
    return SORT_MAP[param] ?? SORT_MAP.newest
}

class ReelService {
    static async get(filter = {}, limit = 20, skip = 0, sort = 'newest') {
        return db.Reel.findAll({
            where: filter,
            limit,
            offset: skip,
            order: resolveSort(sort),
            include: [VIDEO_INCLUDE, THUMB_INCLUDE, SHOP_INCLUDE, PROD_INCLUDE],
        })
    }

    static async getCount(filter = {}) {
        return db.Reel.count({ where: filter })
    }

    static async getById(id, paranoid = true) {
        if (!id) return null
        return db.Reel.findOne({
            where: { id },
            paranoid,
            include: [VIDEO_INCLUDE, THUMB_INCLUDE, SHOP_INCLUDE, PROD_INCLUDE],
        })
    }

    static async create({ shop_id, video_id, thumbnail_id, caption, product_id }) {
        return db.Reel.create({ shop_id, video_id, thumbnail_id, caption, product_id })
    }

    static async update(id, { thumbnail_id, caption, product_id, is_active }) {
        return db.Reel.update(
            { thumbnail_id, caption, product_id, is_active },
            { where: { id } }
        )
    }

    static async incrementViews(id) {
        return db.Reel.increment('view_count', { where: { id } })
    }

    static async delete(id, force = false) {
        return db.Reel.destroy({ where: { id }, force })
    }
}

module.exports = ReelService
