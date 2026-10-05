const { Op } = require('sequelize')
const db = require('../../../models')
const ApiError = require('../../../exceptions/api-error')
const PurchaseService = require('../../wallet/services/PurchaseService')
const { BANNER_STATUSES } = require('../models/Banner.model')

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

    static getFilter({ shop_id, banner_type_id, type_slug, is_active, status } = {}) {
        const filter = {}
        if (status) filter.status = status
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

    // Public feed for the mobile app.
    //   type    – placement code (banner_types.slug), e.g. main_page | shop_page
    //   shop_id – only that shop's banners ('null' = admin/global banners)
    static async getActive({ shop_id, banner_type_id, type } = {}) {
        const now = new Date()
        const filter = {
            is_active: true,
            status: BANNER_STATUSES.APPROVED,
            [Op.and]: [
                { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: now } }] },
                { [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gte]: now } }] },
            ],
        }
        if (shop_id !== undefined) filter.shop_id = shop_id === 'null' ? null : shop_id
        if (banner_type_id) filter.banner_type_id = banner_type_id
        const include = this._include()
        if (type) {
            const typeInclude = include.find((i) => i.as === 'banner_type')
            typeInclude.where = { slug: type }
            typeInclude.required = true
        }
        return db.Banner.findAll({
            where: filter,
            order: [['sort_order', 'ASC'], ['createdAt', 'DESC']],
            include,
        })
    }

    static async create(body) {
        return db.Banner.create(body)
    }

    static async update(id, body) {
        await db.Banner.update(body, { where: { id } })
        return this.getById(id)
    }

    // ── Seller purchase flow ──────────────────────────────────────────────────

    static async getPurchasableTypes() {
        return db.BannerType.findAll({
            where: {
                is_active: true,
                max_days: { [Op.gt]: 0 },
                [Op.or]: [{ price_per_day_tmt: { [Op.gt]: 0 } }, { price_per_day_coin: { [Op.gt]: 0 } }],
            },
            order: [['id', 'ASC']],
        })
    }

    // Charges the seller and creates a PENDING banner; nothing is visible to buyers until an
    // admin approves it (see approve()).
    static async purchase({ userId, shopId, body }) {
        const { banner_type_id, duration_days, currency } = body
        const days = Number(duration_days)
        if (!Number.isInteger(days) || days < 1) throw ApiError.BadRequest('Gün sanyny giriziň')
        if (!['COIN', 'TMT'].includes(currency)) throw ApiError.BadRequest('Töleg görnüşini saýlaň')

        const type = banner_type_id ? await db.BannerType.findByPk(banner_type_id) : null
        if (!type || !type.is_active) throw ApiError.BadRequest('Banner ýerleşimini saýlaň')
        if (!type.max_days) throw ApiError.BadRequest('Bu ýerleşim satyjylar üçin elýeterli däl')
        if (days > type.max_days) throw ApiError.BadRequest(`Iň köp gün sany: ${type.max_days}`)

        const perDay = currency === 'COIN' ? type.price_per_day_coin : type.price_per_day_tmt
        if (!(Number(perDay) > 0)) throw ApiError.BadRequest('Bu ýerleşim üçin bu töleg görnüşi elýeterli däl')
        const amount = Number(perDay) * days

        const { title, subtitle, media_id, image_url, link_url, button_text, button_url } = body
        const banner = await db.Banner.create({
            shop_id: shopId, banner_type_id: type.id, title, subtitle,
            media_id: media_id || null, image_url, link_url, button_text, button_url,
            duration_days: days, currency, paid_amount: amount,
            status: BANNER_STATUSES.PENDING, is_active: false,
        })

        try {
            const tx = await PurchaseService.charge({
                userId, shopId, currency, amount,
                feature: 'BANNER', referenceId: banner.id,
                note: `Banner "${title}" — ${days} gün (${type.name})`,
            })
            await banner.update({ wallet_transaction_id: tx.id })
        } catch (e) {
            await banner.destroy({ force: true })
            throw e
        }
        return this.getById(banner.id)
    }

    // Moderation. Admin may override placement and dates; defaults are the seller's choice
    // and [now, now + duration_days]. The paid amount is never recalculated.
    static async approve(id, { banner_type_id, starts_at, ends_at } = {}) {
        const banner = await db.Banner.findByPk(id)
        if (!banner) throw ApiError.NotFound('Banner tapylmady')
        if (banner.status === BANNER_STATUSES.REJECTED) throw ApiError.BadRequest('Banner ret edilen')

        const typeId = banner_type_id || banner.banner_type_id
        const type = typeId ? await db.BannerType.findByPk(typeId) : null
        if (!type || !type.is_active) throw ApiError.BadRequest('Banner ýerleşimi nädogry')

        const start = starts_at ? new Date(starts_at) : new Date()
        const end = ends_at
            ? new Date(ends_at)
            : new Date(start.getTime() + (banner.duration_days || 7) * 24 * 60 * 60 * 1000)
        if (isNaN(start) || isNaN(end)) throw ApiError.BadRequest('Sene nädogry')
        if (end <= start) throw ApiError.BadRequest('Tamamlanýan sene başlanýandan soň bolmaly')

        await banner.update({
            banner_type_id: type.id, starts_at: start, ends_at: end,
            status: BANNER_STATUSES.APPROVED, is_active: true, reject_reason: null,
        })
        return this.getById(id)
    }

    static async reject(id, reason) {
        const banner = await db.Banner.findByPk(id)
        if (!banner) throw ApiError.NotFound('Banner tapylmady')
        if (banner.status !== BANNER_STATUSES.PENDING) throw ApiError.BadRequest('Diňe garaşylýan banneri ret etmek bolýar')

        if (banner.wallet_transaction_id) {
            await PurchaseService.refund(banner.wallet_transaction_id, `Banner #${id} ret edildi`)
        }
        await banner.update({ status: BANNER_STATUSES.REJECTED, is_active: false, reject_reason: reason || null })
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
