const router = require('express').Router();
const { Op } = require('sequelize');
const ApiError = require('../../exceptions/api-error');
const db = require('../../models');
const ProductService = require('../../__modules__/catalog/services/products');
const { FUNCTIONS } = require('../../utils/functions');

// GET /seller/products
router.get('/', async (req, res, next) => {
    try {
        const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
        const filter = { shop_id: req.shop.id };
        if (req.query.text) {
            filter[Op.or] = [
                { name:    { [Op.iLike]: `%${req.query.text}%` } },
                { name_ru: { [Op.iLike]: `%${req.query.text}%` } },
            ];
        }
        if (req.query.category_id) filter.category_id = req.query.category_id;
        if (req.query.is_active !== undefined) filter.is_active = req.query.is_active;

        const [data, count] = await Promise.all([
            ProductService.get(filter, limit, sort, skip),
            ProductService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// GET /seller/products/:id
router.get('/:id', async (req, res, next) => {
    try {
        const model = await ProductService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// POST /seller/products
router.post('/', async (req, res, next) => {
    try {
        // Enforce plan product_limit
        const plan = req.shop.plan;
        if (plan?.product_limit != null) {
            const count = await db.Product.count({ where: { shop_id: req.shop.id } });
            if (count >= plan.product_limit) {
                throw ApiError.NotAllowed(
                    `Siziň planynyz diňe ${plan.product_limit} haryt goşmaga rugsat berýär. Planynyz täzeläň.`
                );
            }
        }
        // Force shop_id to seller's own shop
        req.body.shop_id = req.shop.id;
        const model = await ProductService.create(req);
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

// PUT /seller/products/:id
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await ProductService.getById(req.params.id);
        if (!existing || existing.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        req.body.shop_id = req.shop.id;
        await ProductService.update(req.params.id, req);
        const model = await ProductService.getById(req.params.id);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// DELETE /seller/products/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await ProductService.getById(req.params.id);
        if (!existing || existing.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        await ProductService.delete(req.params.id);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

// POST /seller/products/:id/variants
router.post('/:id/variants', async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        const variant = await ProductService.addVariant(req.params.id, req.body);
        return res.status(201).json({ model: variant });
    } catch (e) { next(e); }
});

// PUT /seller/products/:id/variants/:variantId
router.put('/:id/variants/:variantId', async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        await ProductService.updateVariant(req.params.variantId, req.body);
        return res.status(200).json({ ok: true });
    } catch (e) { next(e); }
});

// DELETE /seller/products/:id/variants/:variantId
router.delete('/:id/variants/:variantId', async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        await ProductService.deleteVariant(req.params.variantId);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

module.exports = router;
