const { Op }                       = require('sequelize')
const db                           = require('../../../models')
const { sendMulticastNotification } = require('../../../utils/firebase')

class BuyerRequestService {
    static async get(filter = {}, limit = 20, skip = 0) {
        return db.BuyerRequest.findAll({
            where: filter,
            limit,
            offset: skip,
            order: [['createdAt', 'DESC']],
            include: [
                { model: db.User, as: 'user', attributes: ['id', 'name', 'surname'] },
                ...(db.City ? [{ model: db.City, as: 'city', attributes: ['id', 'name'] }] : []),
            ],
        })
    }

    static async getCount(filter = {}) {
        return db.BuyerRequest.count({ where: filter })
    }

    static async getById(id) {
        return db.BuyerRequest.findOne({
            where: { id },
            include: [
                { model: db.User, as: 'user', attributes: ['id', 'name', 'surname'] },
                ...(db.City ? [{ model: db.City, as: 'city', attributes: ['id', 'name'] }] : []),
            ],
        })
    }

    static async create({ user_id, city_id, text, images, budget, quantity }) {
        return db.BuyerRequest.create({ user_id, city_id, text, images, budget, quantity, status: 0 })
    }

    static async close(id, user_id) {
        return db.BuyerRequest.update({ status: 1 }, { where: { id, user_id } })
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
        if (request.city_id) shopWhere.city_id = request.city_id

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
            type:      20, // BUYER_REQUEST type
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
