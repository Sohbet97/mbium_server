const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const PayoutService = require('../../__modules__/payouts/services/payouts');
const { FUNCTIONS } = require('../../utils/functions');

// GET /seller/payouts/balance
router.get('/balance', async (req, res, next) => {
    try {
        const model = await PayoutService.getBalanceByShop(req.shop.id);
        return res.status(200).json({ model: model || { shop_id: req.shop.id, balance: 0, currency: 'TMT' } });
    } catch (e) { next(e); }
});

// GET /seller/payouts/requests
router.get('/requests', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const filter = PayoutService.getRequestFilter({ shop_id: req.shop.id });
        const [data, count] = await Promise.all([
            PayoutService.getRequests(filter, limit, skip),
            PayoutService.getRequestsCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// POST /seller/payouts/requests — seller submits a withdrawal request
router.post('/requests', async (req, res, next) => {
    try {
        const balance = await PayoutService.getBalanceByShop(req.shop.id);
        const available = parseFloat(balance?.balance ?? 0);
        const requested = parseFloat(req.body.amount ?? 0);

        if (requested <= 0) throw ApiError.BadRequest('Mukdar nädogry');
        if (requested > available) throw ApiError.BadRequest('Balans ýeterlik däl');

        const model = await PayoutService.createRequest({
            shop_id:      req.shop.id,
            requested_by: req.user.id,
            amount:       requested,
            currency:     'TMT',
            note:         req.body.note || null,
            status:       0,
        });
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

module.exports = router;
