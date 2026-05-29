const router = require('express').Router();
const ShopTypeService = require('../../__modules__/shops/services/shop-types');

// GET /buyer/shop-types  – active shop types only
router.get('/', async (req, res, next) => {
    try {
        const data = await ShopTypeService.get({ is_active: true });
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

module.exports = router;
