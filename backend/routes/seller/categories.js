const router = require('express').Router();
const db = require('../../models');

// GET /seller/categories — flat list for product category picker
router.get('/', async (req, res, next) => {
    try {
        const rows = await db.Category.findAll({
            where: { is_active: true },
            attributes: ['id', 'name', 'parent_id'],
            order: [['name', 'ASC']],
        });
        return res.status(200).json({ data: rows });
    } catch (e) { next(e); }
});

module.exports = router;
