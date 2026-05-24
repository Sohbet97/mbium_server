const router = require('express').Router();
const { Op } = require('sequelize');
const db = require('../../models');
const { STATUSE_ACTIVE } = require('../../utils/statuses');

// GET /seller/categories — flat list for product category picker
router.get('/', async (req, res, next) => {
    try {
        const rows = await db.Category.findAll({
            where: { status: { [Op.eq]: STATUSE_ACTIVE } },
            attributes: ['id', 'name', 'parent_id'],
            order: [['name', 'ASC']],
        });
        return res.status(200).json({ data: rows });
    } catch (e) { next(e); }
});

module.exports = router;
