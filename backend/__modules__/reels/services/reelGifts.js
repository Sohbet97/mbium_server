const db = require('../../../models')
const ApiError = require('../../../exceptions/api-error')
const CoinService = require('../../coins/services/CoinService')
const PayoutService = require('../../payouts/services/payouts')

const PLATFORM_SHARE_PCT = 0.30 // galan 0.70 reeli goýan dükana barýar (24 sagat saklanyp)

class ReelGiftService {
    static async getGiftTypes() {
        return db.GiftType.findAll({
            where: { is_active: true },
            order: [['sort_order', 'ASC']],
            include: [{ model: db.Media, as: 'animation', attributes: ['id', 'url', 'mime_type'] }],
        })
    }

    // Buyer sends a gift to a reel. Debits the buyer's coin wallet and credits the reel's
    // shop with 70% of the gift's TMT price (30% platform commission), held 24h in
    // pending_balance like order income. gift_creator_id is kept on reel_gifts as a snapshot only.
    static async sendGift(userId, reelId, giftTypeId, message = null) {
        const reel = await db.Reel.findOne({ where: { id: reelId, is_active: true, moderation_status: 1 } })
        if (!reel) throw ApiError.NotFound('Reel tapylmady')

        const giftType = await db.GiftType.findOne({ where: { id: giftTypeId, is_active: true } })
        if (!giftType) throw ApiError.NotFound('Sowgat görnüşi tapylmady')

        const note = `Gift "${giftType.name}" — reel #${reelId}`
        const priceTmt = Number(giftType.price_tmt)
        const shopAmount = Math.round(priceTmt * (1 - PLATFORM_SHARE_PCT) * 100) / 100
        const commissionAmount = Math.round((priceTmt - shopAmount) * 100) / 100

        // 1) Alyjynyň coin balansyndan tutulýar
        await CoinService.debit(userId, giftType.price_coin, 'GIFT', reelId, note)
        const [coinTx] = (await CoinService.getHistory(userId, 1, 0)).rows

        let gift
        try {
            // 2) Umumy pul hereketi ledger-ine bir setir
            const walletTx = await db.WalletTransaction.create({
                user_id: userId,
                shop_id: reel.shop_id,
                feature: 'GIFT',
                reference_id: String(reelId),
                currency: 'COIN',
                amount: giftType.price_coin,
                status: 'COMPLETED',
                coin_transaction_id: coinTx?.id ?? null,
                seller_transaction_id: null,
                note,
            })

            // 3) reel_gifts ýazgysy
            gift = await db.ReelGift.create({
                user_id: userId,
                reel_id: reelId,
                shop_id: reel.shop_id,
                gift_type_id: giftType.id,
                gift_creator_id: giftType.gift_creator_id,
                price_coin: giftType.price_coin,
                price_tmt: priceTmt,
                message: message || null,
                wallet_transaction_id: walletTx.id,
            })

            // 4) Dükana %70 (24 sagat saklanyp), %30 platformanyň komissiýasy
            const credit = await PayoutService.creditGiftPending(
                reel.shop_id, `gift:${gift.id}`, commissionAmount, shopAmount, note
            )
            await walletTx.update({ seller_transaction_id: credit.id })

            // 5) Denormallaşdyrylan sanawçylar
            await db.Reel.increment(
                { gift_count: 1, gift_coin_total: giftType.price_coin },
                { where: { id: reelId } }
            )
        } catch (err) {
            // Dükan karz alyp bilmedik bolsa, alyjynyň coinlary yzyna gaýtarylýar
            await CoinService.credit(userId, giftType.price_coin, 'GIFT', reelId, `Refund: ${note}`).catch(() => {})
            throw err
        }

        return db.ReelGift.findOne({
            where: { id: gift.id },
            include: [
                { model: db.User, as: 'user', attributes: ['id', 'name', 'surname'] },
                { model: db.GiftType, as: 'gift_type', include: [{ model: db.Media, as: 'animation' }] },
            ],
        })
    }

    static async getReelGifts(reelId, limit = 20, skip = 0) {
        return db.ReelGift.findAndCountAll({
            where: { reel_id: reelId },
            order: [['createdAt', 'DESC']],
            limit,
            offset: skip,
            include: [
                { model: db.User, as: 'user', attributes: ['id', 'name', 'surname'] },
                { model: db.GiftType, as: 'gift_type', attributes: ['id', 'name', 'price_coin'] },
            ],
        })
    }

    // Admin audit feed — every gift sent, filterable by reel/creator, with the reel and
    // gift type attached for context.
    static async getAll(filter = {}, limit = 20, skip = 0) {
        return db.ReelGift.findAndCountAll({
            where: filter,
            order: [['createdAt', 'DESC']],
            limit,
            offset: skip,
            include: [
                { model: db.User, as: 'user', attributes: ['id', 'name', 'surname'] },
                { model: db.Reel, as: 'reel', attributes: ['id', 'caption', 'shop_id'] },
                { model: db.GiftType, as: 'gift_type', attributes: ['id', 'name'] },
                { model: db.GiftCreator, as: 'gift_creator', attributes: ['id', 'name'] },
            ],
        })
    }
}

module.exports = ReelGiftService
