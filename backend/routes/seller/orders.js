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

        const opts = {
            search:   req.query.search    || undefined,
            dateFrom: req.query.from_date || undefined,
            dateTo:   req.query.to_date   || undefined,
        };

        const [data, count] = await Promise.all([
            OrderService.get(filter, limit, skip, true, opts),
            OrderService.getCount(filter, true, opts),
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

// PATCH /seller/orders/:id/status — seller can only make allowed transitions
const SELLER_TRANSITIONS = {
    0: [1, 10],  // pending   → confirmed | cancelled
    1: [2, 10],  // confirmed → processing | cancelled
    2: [3],      // processing → shipped
};

router.patch('/:id/status', async (req, res, next) => {
    try {
        const model = await OrderService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Sargyt tapylmady');

        const { status, note } = req.body;
        const allowed = SELLER_TRANSITIONS[model.status] ?? [];
        if (!allowed.includes(Number(status))) {
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

const ITEM_EDIT_STATUSES = [0, 1]; // pending, confirmed

// PATCH /seller/orders/:id/items/:itemId
router.patch('/:id/items/:itemId', async (req, res, next) => {
    try {
        const model = await OrderService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Sargyt tapylmady');
        if (!ITEM_EDIT_STATUSES.includes(model.status)) {
            throw ApiError.NotAllowed('Bu statusda haryt üýtgedip bolmaýar');
        }
        const quantity = Number(req.body.quantity);
        if (!quantity || quantity < 1) throw ApiError.BadRequest('Mukdar nädogry');
        const item = await OrderService.updateItem(model.id, req.params.itemId, quantity);
        const updated = await OrderService.getById(model.id);
        return res.status(200).json({ model: updated });
    } catch (e) { next(e); }
});

// DELETE /seller/orders/:id/items/:itemId
router.delete('/:id/items/:itemId', async (req, res, next) => {
    try {
        const model = await OrderService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Sargyt tapylmady');
        if (!ITEM_EDIT_STATUSES.includes(model.status)) {
            throw ApiError.NotAllowed('Bu statusda haryt aýryp bolmaýar');
        }
        await OrderService.deleteItem(model.id, req.params.itemId);
        const updated = await OrderService.getById(model.id);
        return res.status(200).json({ model: updated });
    } catch (e) { next(e); }
});

// PATCH /seller/orders/:id/shipments/:shipmentId
router.patch('/:id/shipments/:shipmentId', async (req, res, next) => {
    try {
        const model = await OrderService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Sargyt tapylmady');
        const { carrier, tracking_number } = req.body;
        const updated = await OrderService.updateShipment(req.params.shipmentId, { carrier, tracking_number });
        if (!updated) throw ApiError.NotFound('Ugratma tapylmady');
        return res.status(200).json({ model: updated });
    } catch (e) { next(e); }
});

// DELETE /seller/orders/:id/shipments/:shipmentId
router.delete('/:id/shipments/:shipmentId', async (req, res, next) => {
    try {
        const model = await OrderService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Sargyt tapylmady');
        await OrderService.deleteShipment(req.params.shipmentId);
        return res.status(200).json({ success: true });
    } catch (e) { next(e); }
});

module.exports = router;
