const router = require('express').Router();
const { Op } = require('sequelize');
const db = require('../../models');
const { STATUSE_ACTIVE } = require('../../utils/statuses');

// GET /seller/categories — flat list for the shop-settings category picker (full catalog)
// GET /seller/categories?tree=1 — same, plus any deactivated/deleted ancestors needed to
// correctly nest active categories (marked selectable: false). Without this, an active
// category whose parent was deactivated gets silently misfiled as a top-level category
// by client-side tree builders, with no visual indication anything's wrong.
// GET /seller/categories?mine=1 — restricted to the categories this shop picked in its
// settings, so the product form can't assign a category the shop doesn't deal in. Falls
// back to the full catalog if the shop hasn't picked any yet, so setup order can't lock
// a seller out of creating their first product.
router.get('/', async (req, res, next) => {
    try {
        const where = { status: { [Op.eq]: STATUSE_ACTIVE } };

        if (req.query.mine) {
            const picks = await db.ShopCategory.findAll({
                where: { shop_id: req.shop.id },
                attributes: ['category_id'],
            });
            const pickedIds = picks.map((p) => p.category_id);
            if (pickedIds.length) where.id = { [Op.in]: pickedIds };
        }

        const activeRows = await db.Category.findAll({
            where,
            attributes: ['id', 'name', 'parent_id'],
            order: [['name', 'ASC']],
        });

        if (!req.query.tree) {
            return res.status(200).json({ data: activeRows });
        }

        const data = activeRows.map((c) => ({ ...c.toJSON(), selectable: true }));
        const seen = new Set(data.map((c) => c.id));
        let missing = [...new Set(data.map((c) => c.parent_id).filter((id) => id && !seen.has(id)))];

        while (missing.length) {
            const rows = await db.Category.findAll({
                where: { id: { [Op.in]: missing } },
                attributes: ['id', 'name', 'parent_id'],
                paranoid: false,
            });
            missing = [];
            for (const row of rows) {
                if (seen.has(row.id)) continue;
                seen.add(row.id);
                data.push({ ...row.toJSON(), selectable: false });
                if (row.parent_id && !seen.has(row.parent_id)) missing.push(row.parent_id);
            }
        }

        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

module.exports = router;
