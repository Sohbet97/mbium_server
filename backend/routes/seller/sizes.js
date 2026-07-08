const router = require('express').Router();
const SizeService = require('../../__modules__/sizes/services/SizeService');

// GET /seller/sizes — read-only list for the variant-size picker
router.get('/', async (req, res, next) => {
    try {
        const filter = { is_active: true };
        const result = await SizeService.getAll(filter, undefined, 0);
        res.json({ data: result.rows, count: result.count });
    } catch (e) { next(e); }
});

// GET /seller/sizes/tree
router.get('/tree', async (req, res, next) => {
    try {
        const tree = await SizeService.getTree();
        res.json({ data: tree });
    } catch (e) { next(e); }
});

module.exports = router;
