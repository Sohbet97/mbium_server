const { Op }                       = require('sequelize')
const db                           = require('../../../models')
const { sendMulticastNotification } = require('../../../utils/firebase')
const STATUSES                      = require('../../../utils/statuses')
const { normalizeAttachments }       = require('./attachment-helpers')

class BuyerRequestService {
    static _include() {
        return [
            { model: db.User, as: 'user', attributes: ['id', 'name', 'surname'] },
            ...(db.City ? [{ model: db.City, as: 'city', attributes: ['id', 'name'] }] : []),
            ...(db.Shop ? [{ model: db.Shop, as: 'shop', attributes: ['id', 'name'] }] : []),
            ...(db.Product ? [{ model: db.Product, as: 'product', attributes: ['id', 'name'] }] : []),
            { model: db.BuyerRequestAttachment, as: 'attachments' },
        ]
    }

    static async get(filter = {}, limit = 20, skip = 0) {
        return db.BuyerRequest.findAll({
            where: filter,
            limit,
            offset: skip,
            order: [['createdAt', 'DESC']],
            include: this._include(),
        })
    }

    static async getCount(filter = {}) {
        return db.BuyerRequest.count({ where: filter })
    }

    static async getById(id) {
        return db.BuyerRequest.findOne({
            where: { id },
            include: this._include(),
        })
    }

    static async create({ user_id, city_id, product_id, shop_id, text, attachments, budget, quantity }) {
        const request = await db.BuyerRequest.create({ user_id, city_id, product_id: product_id || null, shop_id: shop_id || null, text, budget, quantity, status: 0 })

        const rows = normalizeAttachments(attachments, 'buyer_request_id', request.id)
        if (rows.length) await db.BuyerRequestAttachment.bulkCreate(rows)

        return this.getById(request.id)
    }

    static async getForShop(shop, limit = 20, skip = 0) {
        const where = {
            status: 0,
            [Op.or]: [
                { shop_id: shop.id },
                { shop_id: null, ...(shop.city_id ? { [Op.or]: [{ city_id: shop.city_id }, { city_id: null }] } : {}) },
            ],
        }
        return db.BuyerRequest.findAll({
            where,
            limit,
            offset: skip,
            order: [['createdAt', 'DESC']],
            include: this._include(),
        })
    }

    static async close(id, user_id) {
        const [affected] = await db.BuyerRequest.update({ status: 1 }, { where: { id, user_id } })
        if (affected) {
            const BuyerRequestOfferService = require('./buyer-request-offers')
            await BuyerRequestOfferService.expireStaleOffers({ requestId: id, force: true })
        }
        return [affected]
    }

    static async delete(id, user_id) {
        return db.BuyerRequest.destroy({ where: { id, user_id } })
    }

    /**
     * Find shops matching the request's city, collect their owners' FCM tokens,
     * send a push notification, create DB notifications, and write a log entry.
     */
    static async notifyMatchingShops(request, io) {
        const shopWhere = { is_active: true }
        if (request.shop_id) {
            shopWhere.id = request.shop_id
        } else if (request.city_id) {
            shopWhere.city_id = request.city_id
        }

        const shops = await db.Shop.findAll({
            where: shopWhere,
            attributes: ['id', 'owner_id'],
        })
        if (!shops.length) return

        const ownerIds = [...new Set(shops.map(s => s.owner_id).filter(Boolean))]
        if (!ownerIds.length) return

        const owners = await db.User.findAll({
            where: {
                id: { [Op.in]: ownerIds },
                device_tokens: { [Op.ne]: [] },
            },
            attributes: ['id', 'device_tokens'],
        })

        // FCM push
        const tokens = owners.flatMap(u => Array.isArray(u.device_tokens) ? u.device_tokens : [])
        const snippet = request.text ? String(request.text).slice(0, 80) : 'Täze müşderi sorgusy'
        const notifPayload = {
            title: 'Täze müşderi sorgusy',
            body:  snippet,
        }
        if (tokens.length) {
            sendMulticastNotification(tokens, notifPayload, {
                type:       'buyer_request',
                request_id: String(request.id),
            }).catch(() => {})
        }

        // DB notifications + socket
        const bulk = owners.map(u => ({
            user_id:   u.id,
            type:      STATUSES.NOT_BUYER_REQUEST,
            target_id: String(request.id),
            content:   snippet,
            status:    0,
        }))
        const records = await db.Notification.bulkCreate(bulk)
        if (io) {
            owners.forEach((u, idx) => {
                io.to(u.id).emit('notification', records[idx])
            })
        }

    }
}

module.exports = BuyerRequestService
