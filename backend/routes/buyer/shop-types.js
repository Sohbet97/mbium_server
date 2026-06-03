const router = require('express').Router();
const ShopTypeService = require('../../__modules__/shops/services/shop-types');
const SHOP_CONSTANTS  = require('../../__modules__/shops/utils/constants');

const SORT_MAP = {
    order:  [['order', 'ASC'],  ['name', 'ASC']],
    name:   [['name',  'ASC']],
    '-name': [['name', 'DESC']],
};

// GET /buyer/shop-types  – active shop types only
router.get('/', async (req, res, next) => {
    try {
        const sort = SORT_MAP[req.query.sort] ?? SHOP_CONSTANTS.DEFAULT_SORT;
        const data = await ShopTypeService.get(
            { is_active: true },
            undefined,
            sort,
        );
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

module.exports = router;
