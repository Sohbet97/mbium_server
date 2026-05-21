const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const { FUNCTIONS } = require('../../utils/functions');
const OrderService = require('../../__modules__/orders/services/orders');

// GET /buyer/orders
router.get('/', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const filter = { user_id: req.user.id };
        if (req.query.status !== undefined) filter.status = req.query.status;
        if (req.query.shop_id) filter.shop_id = req.query.shop_id;
        const [data, count] = await Promise.all([
            OrderService.get(filter, limit, skip),
            OrderService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// GET /buyer/orders/:id
router.get('/:id', async (req, res, next) => {
    try {
        const model = await OrderService.getById(req.params.id);
        if (!model || model.user_id !== req.user.id) throw ApiError.NotFound('Sargyt tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// POST /buyer/orders  – place order
// Body: { shop_id, items: [{product_id, variant_id?, quantity}], delivery_address?, delivery_address_id?, note? }
router.post('/', async (req, res, next) => {
    try {
        const { shop_id, items } = req.body;
        if (!shop_id) throw ApiError.BadRequest('shop_id hökman');
        if (!Array.isArray(items) || !items.length) throw ApiError.BadRequest('Harytlar hökman');
        const model = await OrderService.create(req.user.id, req.body);
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

// POST /buyer/orders/:id/cancel
router.post('/:id/cancel', async (req, res, next) => {
    try {
        const order = await OrderService.getById(req.params.id);
        if (!order || order.user_id !== req.user.id) throw ApiError.NotFound('Sargyt tapylmady');
        // Only pending (0) or confirmed (1) orders can be cancelled by buyer
        if (order.status > 1) throw ApiError.NotAllowed('Bu sargyt ýatyrylmagy mümkin däl');
        await OrderService.updateStatus(order.id, 9, req.body.note ?? null, req.user.id);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

module.exports = router;
