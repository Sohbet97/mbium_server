const db = require('../../../models')
const ApiError = require('../../../exceptions/api-error')
const { GIFT_CREATOR_TRANSACTION_TYPES, GIFT_CREATOR_TRANSACTION_STATUSES } = require('../models/GiftCreatorTransaction.model')

class GiftCreatorService {
    static async get(filter = {}, limit, skip = 0) {
        return db.GiftCreator.findAndCountAll({
            where: filter,
            limit,
            offset: skip,
            order: [['createdAt', 'DESC']],
            include: [{ model: db.GiftCreatorBalance, as: 'balance', required: false }],
        })
    }

    static async getById(id) {
        if (!id) return null
        return db.GiftCreator.findOne({
            where: { id },
            include: [{ model: db.GiftCreatorBalance, as: 'balance', required: false }],
        })
    }

    static async create({ name, avatar_id, contact_note }) {
        const creator = await db.GiftCreator.create({
            name,
            avatar_id: avatar_id || null,
            contact_note: contact_note || null,
        })
        await this.getOrCreateBalance(creator.id)
        return this.getById(creator.id)
    }

    static async update(id, { name, avatar_id, contact_note, is_active }) {
        const existing = await db.GiftCreator.findOne({ where: { id } })
        if (!existing) throw ApiError.NotFound('Sowgat awtory tapylmady')
        await existing.update({ name, avatar_id, contact_note, is_active })
        return this.getById(id)
    }

    static async delete(id) {
        return db.GiftCreator.destroy({ where: { id } })
    }

    // ── Wallet ───────────────────────────────────────────────────────────────────

    static async getOrCreateBalance(giftCreatorId) {
        const [balance] = await db.GiftCreatorBalance.findOrCreate({
            where: { gift_creator_id: giftCreatorId },
            defaults: { gift_creator_id: giftCreatorId, available_balance: 0 },
        })
        return balance
    }

    static async getBalance(giftCreatorId) {
        return db.GiftCreatorBalance.findOne({ where: { gift_creator_id: giftCreatorId } })
    }

    static async getTransactions(giftCreatorId, limit = 20, skip = 0) {
        return db.GiftCreatorTransaction.findAndCountAll({
            where: { gift_creator_id: giftCreatorId },
            order: [['createdAt', 'DESC']],
            limit,
            offset: skip,
        })
    }

    // Credits a gift creator for a sent gift: 70% lands on available_balance immediately
    // (gifts aren't returnable, so no hold period like order proceeds get), 30% is recorded
    // as a COMMISSION ledger row for audit only — it never touches the balance itself.
    // Mirrors PayoutService.creditOrderPending's shape (backend/__modules__/payouts/services/payouts.js).
    static async creditGift(giftCreatorId, grossAmountTmt, commissionAmountTmt, creatorAmountTmt, referenceId, note) {
        const balance = await this.getOrCreateBalance(giftCreatorId)

        if (commissionAmountTmt > 0) {
            await db.GiftCreatorTransaction.create({
                gift_creator_id: giftCreatorId,
                type: GIFT_CREATOR_TRANSACTION_TYPES.COMMISSION,
                amount: -commissionAmountTmt,
                status: GIFT_CREATOR_TRANSACTION_STATUSES.AVAILABLE,
                reference_id: referenceId,
                note: note ?? `Mbium komissiýasy`,
            })
        }

        await balance.increment('available_balance', { by: creatorAmountTmt })
        await balance.reload()

        const creditRow = await db.GiftCreatorTransaction.create({
            gift_creator_id: giftCreatorId,
            type: GIFT_CREATOR_TRANSACTION_TYPES.GIFT_CREDIT,
            amount: creatorAmountTmt,
            status: GIFT_CREATOR_TRANSACTION_STATUSES.AVAILABLE,
            balance_after: balance.available_balance,
            reference_id: referenceId,
            note,
        })

        return { balance, creditRow }
    }
}

module.exports = GiftCreatorService
