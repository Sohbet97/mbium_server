const router = require("express").Router();
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");
const db = require("../../models");
const { FUNCTIONS } = require("../../utils/functions");

router.use(routeGuard({
    GET: Permissions.PRODUCT_GET,
}));

// GET /admin/favorites  — paginated list of all user favorites
router.get("/favorites", async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const result = await db.Favorite.findAndCountAll({
            order: [["createdAt", "DESC"]],
            limit,
            offset: skip,
            include: [
                { model: db.User,    as: "user",    attributes: ["id", "name", "surname", "phone_number"] },
                {
                    model: db.Product, as: "product",
                    attributes: ["id", "name", "price", "currency", "rating"],
                    include: [{
                        model: db.ProductMedia, as: "productMedia",
                        where: { role: "primary", variant_id: null }, required: false,
                        include: [{ model: db.Media, as: "media", attributes: ["id", "url", "thumbnail_url"] }],
                    }],
                },
            ],
        });
        res.json({ data: result.rows, count: result.count });
    } catch (e) { next(e); }
});

module.exports = router;
