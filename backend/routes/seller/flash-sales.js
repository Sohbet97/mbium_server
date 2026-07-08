const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const db = require('../../models');
const FlashSaleService = require('../../__modules__/discounts/services/flash-sales');

// GET /seller/flash-sales?product_id=&variant_id=
router.get('/', async (req, res, next) => {
    try {
        const filter = FlashSaleService.getFilter({ ...req.query, shop_id: req.shop.id });
        if (req.query.variant_id !== undefined) filter.variant_id = req.query.variant_id === 'null' ? null : req.query.variant_id;
        const data = await FlashSaleService.get(filter);
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// POST /seller/flash-sales
router.post('/', async (req, res, next) => {
    try {
        const { product_id, variant_id } = req.body;
        const product = await db.Product.findOne({ where: { id: product_id, shop_id: req.shop.id } });
        if (!product) throw ApiError.NotFound('Haryt tapylmady');
        if (variant_id) {
            const variant = await db.ProductVariant.findOne({ where: { id: variant_id, product_id } });
            if (!variant) throw ApiError.NotFound('Wariant tapylmady');
        }
        const model = await FlashSaleService.create({ ...req.body, shop_id: req.shop.id });
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

// PUT /seller/flash-sales/:id
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await FlashSaleService.getById(req.params.id);
        if (!existing || existing.shop_id !== req.shop.id) throw ApiError.NotFound('Aksiýa tapylmady');
        const model = await FlashSaleService.update(req.params.id, req.body);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// DELETE /seller/flash-sales/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await FlashSaleService.getById(req.params.id);
        if (!existing || existing.shop_id !== req.shop.id) throw ApiError.NotFound('Aksiýa tapylmady');
        await FlashSaleService.delete(req.params.id);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

module.exports = router;
