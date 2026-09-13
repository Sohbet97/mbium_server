const router = require('express').Router();
const db = require('../../models');
const { PAYOUT_REQUEST_STATUSES } = require('../../__modules__/payouts/models/PayoutRequest.model');

// GET /seller/pending-counts — counts of the active shop's own pending items,
// for the seller sidebar's red badges. Scoped to req.shop.id throughout.
router.get('/', async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const [products, reels, payoutRequests, shopTypeRequests] = await Promise.all([
            db.Product.count({ where: { shop_id: shopId, moderation_status: 0 } }),
            db.Reel.count({ where: { shop_id: shopId, moderation_status: 0 } }),
            db.PayoutRequest.count({ where: { shop_id: shopId, status: PAYOUT_REQUEST_STATUSES.PENDING } }),
            db.ShopTypeChangeRequest.count({ where: { shop_id: shopId, status: 0 } }),
        ]);

        return res.status(200).json({
            data: { products, reels, payoutRequests, shopTypeRequests },
        });
    } catch (e) { next(e); }
});

module.exports = router;
