const router = require('express').Router();
const { Op } = require('sequelize');
const db = require('../../models');
const DeliveryTypeService = require('../../__modules__/delivery-types/services/DeliveryTypeService');

// GET /seller/delivery-types — full active catalog, for the shop-settings delivery-type picker
// GET /seller/delivery-types?mine=1 — restricted to the delivery types this shop picked in its
// settings, for the product form's picker. Falls back to the full catalog if the shop hasn't
// picked any yet, so setup order can't lock a seller out of creating their first product.
router.get('/', async (req, res, next) => {
    try {
        const filter = { is_active: true };

        if (req.query.mine) {
            const picks = await db.ShopDeliveryType.findAll({
                where: { shop_id: req.shop.id },
                attributes: ['delivery_type_id'],
            });
            const pickedIds = picks.map((p) => p.delivery_type_id);
            if (pickedIds.length) filter.id = { [Op.in]: pickedIds };
        }

        const result = await DeliveryTypeService.getAll(filter, undefined, 0);
        res.json({ data: result.rows, count: result.count });
    } catch (e) { next(e); }
});

module.exports = router;
