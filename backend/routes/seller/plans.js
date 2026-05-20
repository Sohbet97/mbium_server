const router = require('express').Router();
const PlanService = require('../../__modules__/subscriptions/services/PlanService');
const ShopSubscriptionService = require('../../__modules__/subscriptions/services/ShopSubscriptionService');

// GET /seller/plans — all active plans (for comparison UI)
router.get('/', async (req, res, next) => {
    try {
        const plans = await PlanService.getAll(); // is_active = true only
        return res.status(200).json({ data: plans });
    } catch (e) { next(e); }
});

// GET /seller/subscription — current active subscription for this shop
router.get('/subscription', async (req, res, next) => {
    try {
        const model = await ShopSubscriptionService.getActiveForShop(req.shop.id);
        return res.status(200).json({ model: model ?? null });
    } catch (e) { next(e); }
});

module.exports = router;
