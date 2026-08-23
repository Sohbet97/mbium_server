const router = require('express').Router();
const ColorService = require('../../__modules__/colors/services/ColorService');

// GET /seller/colors — active palette, for the product/variant colour pickers.
// Read-only: only admins curate the palette.
router.get('/', async (req, res, next) => {
    try {
        const filter = { ...ColorService.buildFilter({ text: req.query.text }), is_active: true };
        const result = await ColorService.getAll(filter, undefined, 0);
        res.json({ data: result.rows, count: result.count });
    } catch (e) { next(e); }
});

module.exports = router;
