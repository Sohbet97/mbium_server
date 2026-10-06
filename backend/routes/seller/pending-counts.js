const router = require('express').Router();
const db = require('../../models');
const { QueryTypes } = require('sequelize');
const { PAYOUT_REQUEST_STATUSES } = require('../../__modules__/payouts/models/PayoutRequest.model');

// GET /seller/pending-counts — counts of the active shop's own pending items,
// for the seller sidebar's red badges. Scoped to req.shop.id throughout.
router.get('/', async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const [products, reels, payoutRequests, shopTypeRequests, tariffRequests, chats] = await Promise.all([
            db.Product.count({ where: { shop_id: shopId, moderation_status: 0 } }),
            db.Reel.count({ where: { shop_id: shopId, moderation_status: 0 } }),
            db.PayoutRequest.count({ where: { shop_id: shopId, status: PAYOUT_REQUEST_STATUSES.PENDING } }),
            db.ShopTypeChangeRequest.count({ where: { shop_id: shopId, status: 0 } }),
            db.TariffRequest.count({ where: { shop_id: shopId, status: 'pending' } }),
            // Chats (this shop's shop/product dialogs + the seller's own support room) with unread messages
            db.sequelize.query(
                `SELECT COUNT(*)::int AS n FROM chat_rooms r
                 WHERE ((r.type = 20 AND r.shop_id = :shopId)
                     OR (r.type = 1 AND EXISTS (SELECT 1 FROM chat_room_participants sp
                                                WHERE sp.chatroom_id = r.id AND sp.user_id = :userId AND sp.role = 1)))
                   AND EXISTS (SELECT 1 FROM chat_messages m
                               WHERE m.chatroom_id = r.id AND m."createdBy" != :userId
                                 AND NOT EXISTS (SELECT 1 FROM chat_message_reads rd WHERE rd.message_id = m.id AND rd.user_id = :userId))`,
                { replacements: { shopId, userId: req.user.id }, type: QueryTypes.SELECT }
            ).then((rows) => rows[0]?.n ?? 0),
        ]);

        return res.status(200).json({
            data: { products, reels, payoutRequests, shopTypeRequests, tariffRequests, chats },
        });
    } catch (e) { next(e); }
});

module.exports = router;
