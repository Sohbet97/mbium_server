const router = require('express').Router();
const { Op } = require('sequelize');
const ApiError = require('../../exceptions/api-error');
const db = require('../../models');
const MediaService = require('../../__modules__/media/services/media');
const { mediaUpload } = require('../../utils/upload');

// GET /seller/media — list media uploaded by this seller
router.get('/', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 40, 100);
        const skip  = parseInt(req.query.skip) || 0;
        const where = { uploaded_by: req.user.id };
        if (req.query.type)   where.type = req.query.type;
        if (req.query.search) where.original_name = { [Op.iLike]: `%${req.query.search}%` };

        const { count, rows } = await db.Media.findAndCountAll({
            where,
            limit,
            offset: skip,
            order: [['createdAt', 'DESC']],
        });
        return res.status(200).json({ data: rows, count });
    } catch (e) { next(e); }
});

// POST /seller/media/upload — upload one or more media files
router.post('/upload', mediaUpload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) throw ApiError.BadRequest('Faýl saýlanmady');
        const media = await MediaService.processUpload(req.file, req.user.id, req.query.media_type);
        return res.status(201).json({ model: media });
    } catch (e) { next(e); }
});

// DELETE /seller/media/:id — delete own media
router.delete('/:id', async (req, res, next) => {
    try {
        const m = await db.Media.findByPk(req.params.id);
        if (!m) throw ApiError.NotFound('Media tapylmady');
        if (m.uploaded_by !== req.user.id) throw ApiError.Forbidden('Bu media siziňki däl');
        await MediaService.remove(m.id);
        return res.status(200).json({ message: 'Öçürildi' });
    } catch (e) { next(e); }
});

// GET /seller/media/product/:productId — media attached to one of seller's products
router.get('/product/:productId', async (req, res, next) => {
    try {
        const product = await db.Product.findOne({ where: { id: req.params.productId, shop_id: req.shop.id } });
        if (!product) throw ApiError.NotFound('Haryt tapylmady');
        const data = await MediaService.getProductMedia(product.id);
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// POST /seller/media/product/:productId — attach media to product
router.post('/product/:productId', async (req, res, next) => {
    try {
        const product = await db.Product.findOne({ where: { id: req.params.productId, shop_id: req.shop.id } });
        if (!product) throw ApiError.NotFound('Haryt tapylmady');

        const { media_id, role = 'gallery', sort_order = 0 } = req.body;
        const m = await db.Media.findOne({ where: { id: media_id, uploaded_by: req.user.id } });
        if (!m) throw ApiError.NotFound('Media tapylmady ýa-da siziňki däl');

        const record = await MediaService.attachToProduct(product.id, media_id, role, Number(sort_order));
        return res.status(200).json({ model: record });
    } catch (e) { next(e); }
});

// PATCH /seller/media/product/:productId/:mediaId — update role / sort_order
router.patch('/product/:productId/:mediaId', async (req, res, next) => {
    try {
        const product = await db.Product.findOne({ where: { id: req.params.productId, shop_id: req.shop.id } });
        if (!product) throw ApiError.NotFound('Haryt tapylmady');
        const record = await MediaService.updateProductMedia(product.id, req.params.mediaId, req.body);
        return res.status(200).json({ model: record });
    } catch (e) { next(e); }
});

// DELETE /seller/media/product/:productId/:mediaId — detach from product
router.delete('/product/:productId/:mediaId', async (req, res, next) => {
    try {
        const product = await db.Product.findOne({ where: { id: req.params.productId, shop_id: req.shop.id } });
        if (!product) throw ApiError.NotFound('Haryt tapylmady');
        await MediaService.detachFromProduct(product.id, req.params.mediaId);
        return res.status(200).json({ message: 'Aýryldy' });
    } catch (e) { next(e); }
});

module.exports = router;
