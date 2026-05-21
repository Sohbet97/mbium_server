const router = require('express').Router();
const { Op } = require('sequelize');
const ApiError = require('../../exceptions/api-error');
const { FUNCTIONS } = require('../../utils/functions');
const ProductService  = require('../../__modules__/catalog/services/products');
const CategoryService = require('../../__modules__/catalog/services/categories');
const CollectionService = require('../../__modules__/catalog/services/collections');
const ShopService     = require('../../__modules__/shops/services/shops');

// ── Categories ────────────────────────────────────────────────────────────────

// GET /buyer/catalog/categories  – flat list (active only)
router.get('/categories', async (req, res, next) => {
    try {
        const data = await CategoryService.get({ status: 1 });
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// GET /buyer/catalog/categories/tree
router.get('/categories/tree', async (req, res, next) => {
    try {
        const data = await CategoryService.getTree();
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// GET /buyer/catalog/categories/:id
router.get('/categories/:id', async (req, res, next) => {
    try {
        const model = await CategoryService.getById(req.params.id);
        if (!model || model.status !== 1) throw ApiError.NotFound('Kategoriýa tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// ── Collections ───────────────────────────────────────────────────────────────

// GET /buyer/catalog/collections
router.get('/collections', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const [data, count] = await Promise.all([
            CollectionService.get({ is_active: true }, limit, undefined, skip),
            CollectionService.getCount({ is_active: true }),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// GET /buyer/catalog/collections/:id
router.get('/collections/:id', async (req, res, next) => {
    try {
        const model = await CollectionService.getById(req.params.id);
        if (!model || !model.is_active) throw ApiError.NotFound('Kolleksiýa tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// ── Shops ─────────────────────────────────────────────────────────────────────

// GET /buyer/catalog/shops
router.get('/shops', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const filter = { is_active: true };
        if (req.query.text) {
            filter[Op.or] = [
                { name:    { [Op.iLike]: `%${req.query.text}%` } },
                { name_ru: { [Op.iLike]: `%${req.query.text}%` } },
            ];
        }
        if (req.query.type_id) filter.type_id = req.query.type_id;
        const [data, count] = await Promise.all([
            ShopService.get(filter, limit, undefined, skip),
            ShopService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// GET /buyer/catalog/shops/:id
router.get('/shops/:id', async (req, res, next) => {
    try {
        const model = await ShopService.getById(req.params.id);
        if (!model || !model.is_active) throw ApiError.NotFound('Dükany tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// GET /buyer/catalog/shops/:id/products
router.get('/shops/:id/products', async (req, res, next) => {
    try {
        const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
        const filter = { shop_id: req.params.id, is_active: true };
        if (req.query.category_id) filter.category_id = req.query.category_id;
        if (req.query.text) {
            filter[Op.or] = [
                { name:    { [Op.iLike]: `%${req.query.text}%` } },
                { name_ru: { [Op.iLike]: `%${req.query.text}%` } },
            ];
        }
        const [data, count] = await Promise.all([
            ProductService.get(filter, limit, sort, skip),
            ProductService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// ── Products ──────────────────────────────────────────────────────────────────

// GET /buyer/catalog/products
router.get('/products', async (req, res, next) => {
    try {
        const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
        const filter = { is_active: true };
        if (req.query.category_id) filter.category_id = req.query.category_id;
        if (req.query.shop_id)     filter.shop_id     = req.query.shop_id;
        if (req.query.text) {
            filter[Op.or] = [
                { name:    { [Op.iLike]: `%${req.query.text}%` } },
                { name_ru: { [Op.iLike]: `%${req.query.text}%` } },
            ];
        }
        if (req.query.min_price) filter.price = { ...filter.price, [Op.gte]: parseFloat(req.query.min_price) };
        if (req.query.max_price) filter.price = { ...filter.price, [Op.lte]: parseFloat(req.query.max_price) };

        const [data, count] = await Promise.all([
            ProductService.get(filter, limit, sort, skip),
            ProductService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// GET /buyer/catalog/products/:id
router.get('/products/:id', async (req, res, next) => {
    try {
        const model = await ProductService.getById(req.params.id);
        if (!model || !model.is_active) throw ApiError.NotFound('Haryt tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

module.exports = router;
