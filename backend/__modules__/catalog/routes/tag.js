const router = require("express").Router();
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");

function slugify(str) {
    return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// GET /catalog/tags
router.get("/", async (req, res, next) => {
    try {
        const tags = await db.ProductTag.findAll({ order: [["name", "ASC"]] });
        res.json({ data: tags });
    } catch (e) { next(e); }
});

// POST /catalog/tags
router.post("/", async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) throw ApiError.BadRequest("name is required");
        const slug = slugify(name);
        const tag = await db.ProductTag.create({ name: name.trim(), slug });
        res.status(201).json(tag);
    } catch (e) { next(e); }
});

// PUT /catalog/tags/:id
router.put("/:id", async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) throw ApiError.BadRequest("name is required");
        const slug = slugify(name);
        await db.ProductTag.update({ name: name.trim(), slug }, { where: { id: req.params.id } });
        const tag = await db.ProductTag.findOne({ where: { id: req.params.id } });
        res.json(tag);
    } catch (e) { next(e); }
});

// DELETE /catalog/tags/:id
router.delete("/:id", async (req, res, next) => {
    try {
        await db.ProductTag.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { next(e); }
});

// POST /products/:productId/tags  — attach tag to product
router.post("/:productId/attach", async (req, res, next) => {
    try {
        const { tag_id } = req.body;
        const product = await db.Product.findOne({ where: { id: req.params.productId } });
        if (!product) throw ApiError.NotFound("Product not found");
        await db.ProductTagMap.findOrCreate({
            where: { product_id: req.params.productId, tag_id },
        });
        res.json({ success: true });
    } catch (e) { next(e); }
});

// DELETE /products/:productId/tags/:tagId  — detach tag from product
router.delete("/:productId/detach/:tagId", async (req, res, next) => {
    try {
        await db.ProductTagMap.destroy({
            where: { product_id: req.params.productId, tag_id: req.params.tagId },
        });
        res.json({ success: true });
    } catch (e) { next(e); }
});

module.exports = router;
