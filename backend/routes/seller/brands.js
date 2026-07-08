const router = require('express').Router();
const BrandService = require('../../__modules__/brands/services/BrandService');

// GET /seller/brands — read-only list for the product form's brand picker
router.get('/', async (req, res, next) => {
    try {
        const filter = { is_active: true };
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
