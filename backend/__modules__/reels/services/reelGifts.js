const db = require('../../../models')
const ApiError = require('../../../exceptions/api-error')
const CoinService = require('../../coins/services/CoinService')
const GiftCreatorService = require('../../giftCreators/services/giftCreators')

const PLATFORM_SHARE_PCT = 0.30 // galan 0.70 sowgadyň awtoryna (creator) barýar — dükana däl

class ReelGiftService {
    static async getGiftTypes() {
        return db.GiftType.findAll({
            where: { is_active: true },
            order: [['sort_order', 'ASC']],
            include: [{ model: db.Media, as: 'animation', attributes: ['id', 'url', 'mime_type'] }],
        })
    }

    // Buyer sends a gift to a reel. Debits the buyer's coin wallet, credits the gift's
    // creator (NOT the reel's shop) with the 70% TMT-equivalent revenue share, and
    // records the send. Mirrors TurboService.purchase's shape but splits payment two ways
    // (coin debit from buyer + TMT credit to creator) instead of a single-sided charge.
    static async sendGift(userId, reelId, giftTypeId, message = null) {
        const reel = await db.Reel.findOne({ where: { id: reelId, is_active: true, moderation_status: 1 } })
        if (!reel) throw ApiError.NotFound('Reel tapylmady')

        const giftType = await db.GiftType.findOne({ where: { id: giftTypeId, is_active: true } })
        if (!giftType) throw ApiError.NotFound('Sowgat görnüşi tapylmady')

        const note = `Gift "${giftType.name}" — reel #${reelId}`

        // 1) Alyjynyň coin balansyndan tutulýar
        await CoinService.debit(userId, giftType.price_coin, 'GIFT', reelId, note)
        const [coinTx] = (await CoinService.getHistory(userId, 1, 0)).rows

        // 2) Sowgadyň awtoryna (creator) %70 geçirilýär, %30 komissiýa hökmünde ýazgy edilýär
        const priceTmt = Number(giftType.price_tmt)
        const creatorAmount = Math.round(priceTmt * (1 - PLATFORM_SHARE_PCT) * 100) / 100
        const commissionAmount = Math.round((priceTmt - creatorAmount) * 100) / 100
        await GiftCreatorService.creditGift(
            giftType.gift_creator_id, priceTmt, commissionAmount, creatorAmount, reelId, note
        )

        // 3) Umumy pul hereketi ledger-ine bir setir. seller_transaction_id ulanylmaýar —
        //    ol diňe seller_transactions-a salgylanýar, gift_creator_transactions-a däl;
        //    creator-kredit reel_gifts.gift_creator_id arkaly yzarlanýar.
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

        // 4) reel_gifts ýazgysy + denormallaşdyrylan sanawçylar
        const gift = await db.ReelGift.create({
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
        await db.Reel.increment(
            { gift_count: 1, gift_coin_total: giftType.price_coin },
            { where: { id: reelId } }
        )

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
