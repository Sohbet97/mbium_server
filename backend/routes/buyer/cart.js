const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const CartService = require('../../__modules__/orders/services/cart');

// GET /buyer/cart
router.get('/', async (req, res, next) => {
    try {
        const data = await CartService.getByUser(req.user.id);
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// PUT /buyer/cart  – add or update item
// Body: { product_id, variant_id?, variant_size_id?, quantity }
router.put('/', async (req, res, next) => {
    try {
        const { product_id, variant_id, variant_size_id, quantity } = req.body;
        if (!product_id) throw ApiError.BadRequest('product_id hökman');
        const item = await CartService.upsert(req.user.id, product_id, variant_id ?? null, variant_size_id ?? null, quantity ?? 1);
        return res.status(200).json({ model: item });
    } catch (e) { next(e); }
});

// DELETE /buyer/cart/:itemId  – remove single item
router.delete('/:itemId', async (req, res, next) => {
    try {
        await CartService.remove(req.user.id, req.params.itemId);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

// DELETE /buyer/cart  – clear all
router.delete('/', async (req, res, next) => {
    try {
        await CartService.clear(req.user.id);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

module.exports = router;
