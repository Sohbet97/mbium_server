const { Op } = require('sequelize')
const db = require('../../../models')
const ApiError = require('../../../exceptions/api-error')
const NotificationService = require('../../../services/notifications')
const PushService = require('../../../services/push')
const { BUYER_REQUEST_OFFER_STATUSES: STATUS, OFFER_FROM_ROLE } = require('../models/BuyerRequestOffer.model')
const { normalizeAttachments } = require('./attachment-helpers')

const MAX_OFFER_ROUNDS = 10

const buildInclude = () => [
    { model: db.Shop, as: 'shop', attributes: ['id', 'name', 'owner_id'] },
    { model: db.Product, as: 'product', attributes: ['id', 'name'] },
    { model: db.BuyerRequest, as: 'request', attributes: ['id', 'user_id', 'status'] },
    { model: db.BuyerRequestOfferAttachment, as: 'attachments' },
]

class BuyerRequestOfferService {
    static async expireStaleOffers({ requestId, force = false } = {}) {
        const where = { status: STATUS.PENDING }
        if (requestId) where.buyer_request_id = requestId
        if (!force) where.expires_at = { [Op.lt]: new Date() }
        return db.BuyerRequestOffer.update({ status: STATUS.EXPIRED }, { where })
    }

    static async getByRequest(requestId, { forShopId } = {}) {
        await this.expireStaleOffers({ requestId })
        const where = { buyer_request_id: requestId }
        if (forShopId) where.shop_id = forShopId
        return db.BuyerRequestOffer.findAll({ where, include: buildInclude(), order: [['createdAt', 'ASC']] })
    }

    static async getById(id) {
        return db.BuyerRequestOffer.findOne({ where: { id }, include: buildInclude() })
    }

    static async _countRounds(offer) {
        let count = 1
        let current = offer
        while (current.parent_offer_id) {
            current = await db.BuyerRequestOffer.findByPk(current.parent_offer_id, { attributes: ['id', 'parent_offer_id'] })
            if (!current) break
            count += 1
        }
        return count
    }

    static async createInitialOffer({ buyer_request_id, shop_id, product_id, variant_id, variant_size_id, unit_price, quantity, currency, note, expires_at, attachments }, io) {
        const request = await db.BuyerRequest.findByPk(buyer_request_id)
        if (!request) throw ApiError.NotFound('Sorag tapylmady')
        if (request.status !== 0) throw ApiError.BadRequest('Sorag ýapyk')
        if (request.shop_id && request.shop_id !== shop_id) throw ApiError.NotAllowed('Bu sorag başga dükana degişli')

        const existing = await db.BuyerRequestOffer.findOne({
            where: { buyer_request_id, shop_id, status: { [Op.in]: [STATUS.PENDING, STATUS.COUNTERED] } },
        })
        if (existing) throw ApiError.Conflict('Bu sorag üçin eýýäm açyk teklibiňiz bar')

        const offer = await db.BuyerRequestOffer.create({
            buyer_request_id,
            shop_id,
            product_id: product_id || request.product_id || null,
            variant_id: variant_id || null,
            variant_size_id: variant_size_id || null,
            parent_offer_id: null,
            from_role: OFFER_FROM_ROLE.SELLER,
            unit_price,
            quantity: quantity || request.quantity || 1,
            currency: currency || 'TMT',
            note: note || null,
            expires_at: expires_at || null,
            status: STATUS.PENDING,
        })

        const attachmentRows = normalizeAttachments(attachments, 'buyer_request_offer_id', offer.id)
        if (attachmentRows.length) await db.BuyerRequestOfferAttachment.bulkCreate(attachmentRows)

        const full = await this.getById(offer.id)
        NotificationService.createForOfferReceived(full, io).catch(() => {})
        PushService.notifyUser(request.user_id, 'Täze teklip', `Siziň soragyňyz üçin teklip geldi: ${unit_price} ${currency || 'TMT'}`, {
            type: 'buyer_request_offer', offer_id: String(offer.id),
        }).catch(() => {})

        return full
    }

    static async _assertCounterpartyCanAct(offer, actor, { actorShopId, userId } = {}) {
        if (offer.status !== STATUS.PENDING) throw ApiError.BadRequest('Bu teklip indi işjeň däl')
        if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
            await offer.update({ status: STATUS.EXPIRED })
            throw ApiError.BadRequest('Teklip möhleti geçdi')
        }

        if (actor === OFFER_FROM_ROLE.SELLER) {
            if (offer.shop_id !== actorShopId) throw ApiError.NotAllowed('Bu teklip siziň dükanyňyza degişli däl')
            if (offer.from_role === OFFER_FROM_ROLE.SELLER) throw ApiError.BadRequest('Öz teklibiňize jogap berip bilmersiňiz')
        } else {
            if (offer.request.user_id !== userId) throw ApiError.NotAllowed('Bu teklip siziň soragyňyza degişli däl')
            if (offer.from_role === OFFER_FROM_ROLE.BUYER) throw ApiError.BadRequest('Öz teklibiňize jogap berip bilmersiňiz')
        }
    }

    static async counterOffer({ offer_id, actor, actorShopId, userId, unit_price, quantity, note, expires_at, attachments }, io) {
        const offer = await this.getById(offer_id)
        if (!offer) throw ApiError.NotFound('Teklip tapylmady')
        await this._assertCounterpartyCanAct(offer, actor, { actorShopId, userId })

        const rounds = await this._countRounds(offer)
        if (rounds >= MAX_OFFER_ROUNDS) throw ApiError.BadRequest('Teklip alyş-berişiniň çägine ýetildi')

        await offer.update({ status: STATUS.COUNTERED })

        const created = await db.BuyerRequestOffer.create({
            buyer_request_id: offer.buyer_request_id,
            shop_id: offer.shop_id,
            product_id: offer.product_id,
            variant_id: offer.variant_id,
            variant_size_id: offer.variant_size_id,
            parent_offer_id: offer.id,
            from_role: actor,
            unit_price,
            quantity: quantity || offer.quantity,
            currency: offer.currency,
            note: note || null,
            expires_at: expires_at || null,
            status: STATUS.PENDING,
        })

        const attachmentRows = normalizeAttachments(attachments, 'buyer_request_offer_id', created.id)
        if (attachmentRows.length) await db.BuyerRequestOfferAttachment.bulkCreate(attachmentRows)

        const full = await this.getById(created.id)
        const notifyUserId = actor === OFFER_FROM_ROLE.SELLER ? offer.request.user_id : offer.shop.owner_id
        NotificationService.createForOfferCountered(full, io, notifyUserId).catch(() => {})
        PushService.notifyUser(notifyUserId, 'Garşy teklip', `${unit_price} ${offer.currency}`, {
            type: 'buyer_request_offer', offer_id: String(created.id),
        }).catch(() => {})

        return full
    }

    static async acceptOffer({ offer_id, actor, actorShopId, userId }, io) {
        const offer = await this.getById(offer_id)
        if (!offer) throw ApiError.NotFound('Teklip tapylmady')
        await this._assertCounterpartyCanAct(offer, actor, { actorShopId, userId })

        await offer.update({ status: STATUS.ACCEPTED })
        const full = await this.getById(offer.id)

        const notifyUserId = actor === OFFER_FROM_ROLE.SELLER ? offer.request.user_id : offer.shop.owner_id
        NotificationService.createForOfferAccepted(full, io, notifyUserId).catch(() => {})
        PushService.notifyUser(notifyUserId, 'Teklip kabul edildi', `Teklip #${offer.id} kabul edildi`, {
            type: 'buyer_request_offer', offer_id: String(offer.id),
        }).catch(() => {})

        return full
    }

    static async rejectOffer({ offer_id, actor, actorShopId, userId }, io) {
        const offer = await this.getById(offer_id)
        if (!offer) throw ApiError.NotFound('Teklip tapylmady')
        await this._assertCounterpartyCanAct(offer, actor, { actorShopId, userId })

        await offer.update({ status: STATUS.REJECTED })
        const full = await this.getById(offer.id)

        const notifyUserId = actor === OFFER_FROM_ROLE.SELLER ? offer.request.user_id : offer.shop.owner_id
        NotificationService.createForOfferRejected(full, io, notifyUserId).catch(() => {})

        return full
    }

    static async markConsumed(offerId, orderId) {
        return db.BuyerRequestOffer.update(
            { consumed_at: new Date(), consumed_order_id: orderId },
            { where: { id: offerId } }
        )
    }
}

module.exports = BuyerRequestOfferService
