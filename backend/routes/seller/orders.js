const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const db = require('../../models');
const OrderService = require('../../__modules__/orders/services/orders');
const { FUNCTIONS } = require('../../utils/functions');

// GET /seller/orders
router.get('/', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const filter = { shop_id: req.shop.id };
        if (req.query.status !== undefined) filter.status = req.query.status;

        const [data, count] = await Promise.all([
            OrderService.get(filter, limit, skip),
            OrderService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// GET /seller/orders/:id
router.get('/:id', async (req, res, next) => {
    try {
        const model = await OrderService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Sargyt tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// PATCH /seller/orders/:id/status — seller can move order through allowed statuses only
// Allowed transitions by seller: PENDING(0)→CONFIRMED(1), CONFIRMED(1)→PROCESSING(2), PROCESSING(2)→SHIPPED(3)
const SELLER_ALLOWED_STATUSES = [1, 2, 3];

router.patch('/:id/status', async (req, res, next) => {
    try {
        const model = await OrderService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Sargyt tapylmady');

        const { status, note } = req.body;
        if (!SELLER_ALLOWED_STATUSES.includes(Number(status))) {
            throw ApiError.NotAllowed('Bu status geçişine rugsat ýok');
        }
        await OrderService.updateStatus(model.id, Number(status), note, req.user.id);
        const updated = await OrderService.getById(model.id);
        return res.status(200).json({ model: updated });
    } catch (e) { next(e); }
});

// GET /seller/orders/:id/shipments
router.get('/:id/shipments', async (req, res, next) => {
    try {
        const model = await OrderService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Sargyt tapylmady');
        const data = await OrderService.getShipments(model.id);
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// POST /seller/orders/:id/shipments
router.post('/:id/shipments', async (req, res, next) => {
    try {
        const model = await OrderService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Sargyt tapylmady');
        const shipment = await OrderService.addShipment(model.id, req.body);
        return res.status(201).json({ model: shipment });
    } catch (e) { next(e); }
});

module.exports = router;
