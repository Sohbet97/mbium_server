const router = require('express').Router();
const DeliveryTypeService = require('../../__modules__/delivery-types/services/DeliveryTypeService');

// GET /seller/delivery-types — read-only list for the product form's delivery-type picker
router.get('/', async (req, res, next) => {
    try {
        const filter = { is_active: true };
        const result = await DeliveryTypeService.getAll(filter, undefined, 0);
        res.json({ data: result.rows, count: result.count });
    } catch (e) { next(e); }
});

module.exports = router;
