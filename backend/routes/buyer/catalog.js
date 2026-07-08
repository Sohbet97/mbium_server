const router = require('express').Router();
const { Op, literal } = require('sequelize');
const ApiError = require('../../exceptions/api-error');
const { FUNCTIONS } = require('../../utils/functions');
const { STATUSE_ACTIVE } = require('../../utils/statuses');
const ProductService  = require('../../__modules__/catalog/services/products');
const CategoryService = require('../../__modules__/catalog/services/categories');
const CollectionService = require('../../__modules__/catalog/services/collections');
const ShopService     = require('../../__modules__/shops/services/shops');
const BrandService    = require('../../__modules__/brands/services/BrandService');
const SizeService     = require('../../__modules__/sizes/services/SizeService');
const SupplierService = require('../../__modules__/suppliers/services/SupplierService');
const SearchService   = require('../../services/search');

// ── Sort helper ───────────────────────────────────────────────────────────────
// Maps buyer-facing sort keys to safe Sequelize order tuples.
// Any unrecognised value falls back to newest-first.
const BUYER_SORT_MAP = {
    newest:     [['createdAt',    'DESC']],
    oldest:     [['createdAt',    'ASC']],
    price_asc:  [['price',        'ASC'],  ['createdAt', 'DESC']],
    price_desc: [['price',        'DESC'], ['createdAt', 'DESC']],
    rating:     [['rating',       'DESC'], ['review_count', 'DESC']],
    popular:    [['review_count', 'DESC'], ['rating',       'DESC']],
    sold:       [['sold_count',   'DESC'], ['createdAt',    'DESC']],
    name_asc:   [['name',         'ASC']],
    name_desc:  [['name',         'DESC']],
    updated:    [['updatedAt',    'DESC']],
};

function resolveBuyerSort(param) {
    return BUYER_SORT_MAP[param] ?? BUYER_SORT_MAP.newest;
}

// ── FTS text-filter helpers ───────────────────────────────────────────────────
// Builds a Sequelize where condition that uses FTS when a valid tsquery can be
// constructed, and falls back to iLike for very short / symbol-only input.

function productTextFilter(text) {
    const q = SearchService.buildTsQuery(text)
    if (q) {
        return literal(
            `to_tsvector('simple',
               COALESCE(name,'') || ' ' || COALESCE(name_ru,'') || ' ' ||
               COALESCE(name_eng,'') || ' ' || COALESCE(sku,'') || ' ' ||
               COALESCE(description,'')
             ) @@ to_tsquery('simple', '${q.replace(/'/g, "''")}')`
        )
    }
    // fallback to iLike for very short queries
    return { [Op.or]: [
        { name:    { [Op.iLike]: `%${text}%` } },
        { name_ru: { [Op.iLike]: `%${text}%` } },
        { sku:     { [Op.iLike]: `%${text}%` } },
    ]}
}

function shopTextFilter(text) {
    const q = SearchService.buildTsQuery(text)
    if (q) {
        return literal(
            `to_tsvector('simple',
               COALESCE(name,'') || ' ' || COALESCE(name_ru,'') || ' ' ||
               COALESCE(name_eng,'') || ' ' || COALESCE(description,'')
             ) @@ to_tsquery('simple', '${q.replace(/'/g, "''")}')`
        )
    }
    return { [Op.or]: [
        { name:    { [Op.iLike]: `%${text}%` } },
        { name_ru: { [Op.iLike]: `%${text}%` } },
    ]}
}

// ── Unified full-text search ──────────────────────────────────────────────────

// GET /buyer/catalog/search?q=&product_limit=20&category_limit=8&shop_limit=8
router.get('/search', async (req, res, next) => {
    try {
        const { q, product_limit, category_limit, shop_limit } = req.query
        if (!q || !String(q).trim()) {
            return res.json({ products: [], categories: [], shops: [], query: '' })
        }
        const result = await SearchService.search(q, {
            productLimit:  Math.min(Number(product_limit)  || 20, 50),
            categoryLimit: Math.min(Number(category_limit) || 8,  20),
            shopLimit:     Math.min(Number(shop_limit)     || 8,  20),
        })
        return res.json(result)
    } catch (e) { next(e) }
})

// ── Categories ────────────────────────────────────────────────────────────────

// GET /buyer/catalog/categories  – flat list (active only)
router.get('/categories', async (req, res, next) => {
    try {
        const data = await CategoryService.get({ status: STATUSE_ACTIVE });
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
        if (!model || model.status !== STATUSE_ACTIVE) throw ApiError.NotFound('Kategoriýa tapylmady');
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
        if (req.query.text) filter[Op.and] = [shopTextFilter(req.query.text)]
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
// ?sort=newest|oldest|price_asc|price_desc|rating|popular|name_asc|name_desc|updated
router.get('/shops/:id/products', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const sort = resolveBuyerSort(req.query.sort);
        const now = new Date();
        const filter = {
            shop_id: req.params.id, is_active: true, is_published: true,
            [Op.or]: [{ scheduled_at: null }, { scheduled_at: { [Op.lte]: now } }],
        };
        if (req.query.category_id) filter.category_id = req.query.category_id;
        if (req.query.text) filter[Op.and] = [productTextFilter(req.query.text)]
        const [data, count] = await Promise.all([
            ProductService.get(filter, limit, sort, skip),
            ProductService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// ── Products ──────────────────────────────────────────────────────────────────

// GET /buyer/catalog/products
// ?sort=newest|oldest|price_asc|price_desc|rating|popular|name_asc|name_desc|updated
router.get('/products', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const sort = resolveBuyerSort(req.query.sort);
        const now = new Date();
        const filter = {
            is_active: true, is_published: true,
            [Op.or]: [{ scheduled_at: null }, { scheduled_at: { [Op.lte]: now } }],
        };
        if (req.query.category_id) filter.category_id = req.query.category_id;
        if (req.query.shop_id)     filter.shop_id     = req.query.shop_id;
        if (req.query.text) filter[Op.and] = [productTextFilter(req.query.text)]
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

// ── Brands (public, read-only) ────────────────────────────────────────────────

router.get('/brands', async (req, res, next) => {
    try {
        const data = await BrandService.getTree();
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

router.get('/brands/:id', async (req, res, next) => {
    try {
        const model = await BrandService.getById(req.params.id);
        if (!model || !model.is_active) throw ApiError.NotFound('Marka tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// ── Sizes (public, read-only) ─────────────────────────────────────────────────

router.get('/sizes', async (req, res, next) => {
    try {
        const data = await SizeService.getTree();
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

router.get('/sizes/:id', async (req, res, next) => {
    try {
        const model = await SizeService.getById(req.params.id);
        if (!model || !model.is_active) throw ApiError.NotFound('Ölçeg tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// ── Suppliers (public, read-only) ─────────────────────────────────────────────

router.get('/suppliers', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const result = await SupplierService.getAll({ is_active: true }, limit, skip);
        return res.status(200).json({ data: result.rows, count: result.count });
    } catch (e) { next(e); }
});

module.exports = router;
