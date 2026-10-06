const router = require('express').Router();
const TariffRequestService = require('../../__modules__/subscriptions/services/TariffRequestService');
const ApiError = require('../../exceptions/api-error');
const { FUNCTIONS } = require('../../utils/functions');

// POST /seller/tariff/request — ask to switch the shop's tariff
router.post('/request', async (req, res, next) => {
    try {
        const { tariff_id, comment } = req.body || {};
        if (!Number.isInteger(Number(tariff_id)) || Number(tariff_id) <= 0) {
            throw ApiError.BadRequest('tariff_id is required');
        }
        if (comment !== undefined && comment !== null && typeof comment !== 'string') {
            throw ApiError.BadRequest('comment must be a string');
        }
        const model = await TariffRequestService.create(req.shop, { tariff_id: Number(tariff_id), comment }, req.user.id);
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

// GET /seller/tariff/request — this shop's requests and their status
router.get('/request', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const { data, count } = await TariffRequestService.getAll({ shop_id: req.shop.id }, limit, skip);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

module.exports = router;
