const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const db = require('../../models');
const { FUNCTIONS } = require('../../utils/functions');

// GET /seller/discounts
router.get('/', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const [data, count] = await Promise.all([
            db.Discount.findAll({ where: { shop_id: req.shop.id }, offset: skip, limit, order: [['createdAt', 'DESC']] }),
            db.Discount.count({ where: { shop_id: req.shop.id } }),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// POST /seller/discounts
router.post('/', async (req, res, next) => {
    try {
        const model = await db.Discount.create({ ...req.body, shop_id: req.shop.id });
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

// PUT /seller/discounts/:id
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await db.Discount.findOne({ where: { id: req.params.id, shop_id: req.shop.id } });
        if (!existing) throw ApiError.NotFound('Arzanladyş tapylmady');
        await existing.update(req.body);
        return res.status(200).json({ model: existing });
    } catch (e) { next(e); }
});

// DELETE /seller/discounts/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await db.Discount.findOne({ where: { id: req.params.id, shop_id: req.shop.id } });
        if (!existing) throw ApiError.NotFound('Arzanladyş tapylmady');
        await existing.destroy();
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

module.exports = router;
