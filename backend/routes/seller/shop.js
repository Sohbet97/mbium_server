const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const ShopService = require('../../__modules__/shops/services/shops');

// GET /seller/shop — view own shop profile
router.get('/', async (req, res, next) => {
    try {
        const model = await ShopService.getById(req.shop.id);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// PATCH /seller/shop — update own shop profile (non-verification fields)
router.patch('/', async (req, res, next) => {
    try {
        // Block fields the seller must not self-update
        const blocked = ['is_active', 'is_verified', 'verification_status', 'seller_tier', 'verified_by', 'plan_id', 'owner_id'];
        blocked.forEach((k) => delete req.body[k]);

        await ShopService.update(req.shop.id, req);
        const model = await ShopService.getById(req.shop.id);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

module.exports = router;
