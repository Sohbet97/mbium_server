const router = require('express').Router();
const { Op } = require('sequelize');
const db = require('../../models');
const BrandService = require('../../__modules__/brands/services/BrandService');

// GET /seller/brands — full active catalog, for the shop-settings brand picker
// GET /seller/brands?mine=1 — restricted to the brands this shop picked in its settings,
// for the product form's brand picker. Falls back to the full catalog if the shop hasn't
// picked any yet, so setup order can't lock a seller out of creating their first product.
router.get('/', async (req, res, next) => {
    try {
        const filter = { is_active: true };

        if (req.query.mine) {
            const picks = await db.ShopBrand.findAll({
                where: { shop_id: req.shop.id },
                attributes: ['brand_id'],
            });
            const pickedIds = picks.map((p) => p.brand_id);
            if (pickedIds.length) filter.id = { [Op.in]: pickedIds };
        }

        const result = await BrandService.getAll(filter, undefined, 0);
        res.json({ data: result.rows, count: result.count });
    } catch (e) { next(e); }
});

// GET /seller/brands/tree
router.get('/tree', async (req, res, next) => {
    try {
        const tree = await BrandService.getTree();
        res.json({ data: tree });
    } catch (e) { next(e); }
});

module.exports = router;
