const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const ShopTypeChangeRequestService = require('../../__modules__/shops/services/shop-type-change-requests');
const { FUNCTIONS } = require('../../utils/functions');

// GET /admin/shop-type-requests
router.get('/', async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.status !== undefined) filter.status = Number(req.query.status);
        if (req.query.shop_id)              filter.shop_id = Number(req.query.shop_id);
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const [data, count] = await Promise.all([
            ShopTypeChangeRequestService.getAll(filter, limit, skip),
            ShopTypeChangeRequestService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// POST /admin/shop-type-requests/:id/approve
router.post('/:id/approve', async (req, res, next) => {
    try {
        const model = await ShopTypeChangeRequestService.approve(req.params.id, req.user?.id);
        if (!model) throw ApiError.NotFound('Ýüzlenme tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// POST /admin/shop-type-requests/:id/reject
router.post('/:id/reject', async (req, res, next) => {
    try {
        const model = await ShopTypeChangeRequestService.reject(req.params.id, req.body?.note, req.user?.id);
        if (!model) throw ApiError.NotFound('Ýüzlenme tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

module.exports = router;
