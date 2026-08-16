const router = require('express').Router();
const SupplierService = require('../../__modules__/suppliers/services/SupplierService');

// GET /seller/suppliers — read-only list for the product form's supplier picker
router.get('/', async (req, res, next) => {
    try {
        const filter = { is_active: true };
        const result = await SupplierService.getAll(filter, undefined, 0);
        res.json({ data: result.rows, count: result.count });
    } catch (e) { next(e); }
});

module.exports = router;
