const { Op } = require('sequelize')
const db = require('../../../models')

const MEDIA_ATTRS = ['id', 'url', 'thumbnail_url', 'original_name', 'type', 'width', 'height']
const TYPE_ATTRS  = ['id', 'name', 'name_ru', 'name_eng', 'slug']

class BannerService {
    static _include() {
        return [
            { model: db.BannerType, as: 'banner_type', attributes: TYPE_ATTRS,  required: false },
            { model: db.Media,      as: 'media',        attributes: MEDIA_ATTRS, required: false },
            { model: db.Shop,       as: 'shop',         attributes: ['id', 'name'], required: false },
        ]
    }

    static getFilter({ shop_id, banner_type_id, type_slug, is_active } = {}) {
        const filter = {}
        if (shop_id !== undefined) filter.shop_id = shop_id === 'null' ? null : shop_id
        if (banner_type_id) filter.banner_type_id = banner_type_id
        if (is_active !== undefined) filter.is_active = is_active === 'true' || is_active === true
        return filter
    }

    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.Banner.findAll({
            where: filter,
            offset: skip,
            limit,
            paranoid,
            order: [['sort_order', 'ASC'], ['createdAt', 'DESC']],
            include: this._include(),
        })
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Banner.count({ where: filter, paranoid })
    }

    static async getById(id, paranoid = true) {
        if (!id) return null
        return db.Banner.findOne({ where: { id }, paranoid, include: this._include() })
    }

    static async create(body) {
        return db.Banner.create(body)
    }

    static async update(id, body) {
        await db.Banner.update(body, { where: { id } })
        return this.getById(id)
    }

    static async reorder(items) {
        // items: [{ id, sort_order }]
        await Promise.all(items.map(({ id, sort_order }) =>
            db.Banner.update({ sort_order }, { where: { id } })
        ))
    }

    static async delete(id, force = false) {
        return db.Banner.destroy({ where: { id }, force })
    }

    static async restore(id) {
        return db.Banner.restore({ where: { id } })
    }
}

class BannerTypeService {
    static async getAll() {
        return db.BannerType.findAll({ where: { is_active: true }, order: [['id', 'ASC']] })
    }

    static async getById(id) {
        return db.BannerType.findByPk(id)
    }

    static async create(body) {
        return db.BannerType.create(body)
    }

    static async update(id, body) {
        await db.BannerType.update(body, { where: { id } })
        return this.getById(id)
    }

    static async delete(id) {
        return db.BannerType.destroy({ where: { id } })
    }
}

module.exports = { BannerService, BannerTypeService }
