const router = require('express').Router();
const { Op } = require('sequelize');
const ApiError = require('../../exceptions/api-error');
const db = require('../../models');
const ProductService = require('../../__modules__/catalog/services/products');
const SpinViewService = require('../../__modules__/catalog/services/spin-view');
const MediaService = require('../../__modules__/media/services/media');
const BgRemovalService = require('../../__modules__/media/services/background-removal');
const { FUNCTIONS } = require('../../utils/functions');
const { mediaUpload } = require('../../utils/upload');

// GET /seller/products
router.get('/', async (req, res, next) => {
    try {
        const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
        const filter = { shop_id: req.shop.id };
        if (req.query.text) {
            filter[Op.or] = [
                { name:    { [Op.iLike]: `%${req.query.text}%` } },
                { name_ru: { [Op.iLike]: `%${req.query.text}%` } },
            ];
        }
        if (req.query.category_id) filter.category_id = req.query.category_id;
        if (req.query.is_active !== undefined) filter.is_active = req.query.is_active;

        const [data, count] = await Promise.all([
            ProductService.get(filter, limit, sort, skip),
            ProductService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// GET /seller/products/:id
router.get('/:id', async (req, res, next) => {
    try {
        const model = await ProductService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// POST /seller/products
router.post('/', async (req, res, next) => {
    try {
        // Enforce plan product_limit
        const plan = req.shop.plan;
        if (plan?.product_limit != null) {
            const count = await db.Product.count({ where: { shop_id: req.shop.id } });
            if (count >= plan.product_limit) {
                throw ApiError.NotAllowed(
                    `Siziň planynyz diňe ${plan.product_limit} haryt goşmaga rugsat berýär. Planynyz täzeläň.`
                );
            }
        }
        // Force shop_id to seller's own shop
        req.body.shop_id = req.shop.id;
        const model = await ProductService.create(req);
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

// PUT /seller/products/:id
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await ProductService.getById(req.params.id);
        if (!existing || existing.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        req.body.shop_id = req.shop.id;
        await ProductService.update(req.params.id, req);
        const model = await ProductService.getById(req.params.id);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// DELETE /seller/products/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await ProductService.getById(req.params.id);
        if (!existing || existing.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        await ProductService.delete(req.params.id);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

// POST /seller/products/:id/variants
router.post('/:id/variants', async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        const variant = await ProductService.addVariant(req.params.id, req.body);
        return res.status(201).json({ model: variant });
    } catch (e) { next(e); }
});

// PUT /seller/products/:id/variants/:variantId
router.put('/:id/variants/:variantId', async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        await ProductService.updateVariant(req.params.variantId, req.body);
        return res.status(200).json({ ok: true });
    } catch (e) { next(e); }
});

// DELETE /seller/products/:id/variants/:variantId
router.delete('/:id/variants/:variantId', async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        await ProductService.deleteVariant(req.params.variantId);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

// POST /seller/products/:id/spin/generate — AI-generate a 360° spin frame sequence from existing product media
router.post('/:id/spin/generate', async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        console.log('aaaa');
        
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');

        const { media_ids, frame_count = 12 } = req.body;
        let data;
        try {
            data = await SpinViewService.generateSpinFrames(
                product.id, media_ids, Number(frame_count), req.user.id
            );
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// POST /seller/products/:id/spin/generate-from-upload — upload 1-4 reference photos
// (e.g. taken on a phone) and AI-generate a 360° spin frame sequence from them.
// Uploaded photos are also attached to the product gallery as regular images.
router.post('/:id/spin/generate-from-upload', mediaUpload.array('files', 4), async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');

        if (!req.files?.length) throw ApiError.BadRequest('Iň az 1 surat ýükläň');

        const existingMedia = await MediaService.getProductMedia(product.id);
        let nextGallerySort = existingMedia.filter((pm) => pm.role === 'gallery').length;

        const mediaIds = [];
        for (const file of req.files) {
            const media = await MediaService.processUpload(file, req.user.id);
            await MediaService.attachToProduct(product.id, media.id, 'gallery', nextGallerySort);
            nextGallerySort += 1;
            mediaIds.push(media.id);
        }

        const { frame_count = 12 } = req.body;
        let data;
        try {
            data = await SpinViewService.generateSpinFrames(
                product.id, mediaIds, Number(frame_count), req.user.id
            );
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// POST /seller/products/:id/media/:mediaId/remove-bg
router.post('/:id/media/:mediaId/remove-bg', async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        const pm = await db.ProductMedia.findOne({
            where: { product_id: product.id, media_id: req.params.mediaId },
        });
        if (!pm) throw ApiError.NotFound('Media tapylmady');
        let result;
        try {
            result = await BgRemovalService.startRemoval(req.params.mediaId);
        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
        return res.status(200).json(result);
    } catch (e) { next(e); }
});

// POST /seller/products/:id/media/:mediaId/remove-bg/confirm
router.post('/:id/media/:mediaId/remove-bg/confirm', async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady');
        const { token, action, variant } = req.body;
        if (!token || !['save_new', 'replace'].includes(action)) {
            throw ApiError.BadRequest('token we action gerek');
        }
        const media = await BgRemovalService.confirmRemoval({
            token,
            productId: product.id,
            mediaId: req.params.mediaId,
            action,
            variant: variant || 'transparent',
        });
        return res.status(200).json({ media });
    } catch (e) { next(e); }
});

// POST /seller/products/:id/media/:mediaId/remove-bg/reject
router.post('/:id/media/:mediaId/remove-bg/reject', async (req, res, next) => {
    try {
        const { token } = req.body;
        if (token) await BgRemovalService.rejectRemoval(token).catch(() => {});
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

// POST /seller/products/:id/media/:mediaId/rotate
router.post('/:id/media/:mediaId/rotate', async (req, res, next) => {
    try {
        const degrees = parseInt(req.body.degrees)
        if (![90, 180, 270].includes(degrees)) throw ApiError.BadRequest('degrees 90, 180 ýa-da 270 bolmaly')

        const product = await ProductService.getById(req.params.id)
        if (!product || product.shop_id !== req.shop.id) throw ApiError.NotFound('Haryt tapylmady')

        const pm = await db.ProductMedia.findOne({
            where: { product_id: product.id, media_id: req.params.mediaId },
        })
        if (!pm) throw ApiError.NotFound('Media tapylmady')

        const media = await db.Media.findByPk(req.params.mediaId)
        if (!media) throw ApiError.NotFound('Media tapylmady')

        let sharp
        try { sharp = require('sharp') } catch { throw ApiError.BadRequest('sharp moduly ýok') }

        const { uploadBuffer, urlToPath } = require('../../utils/firebase')
        const path = require('path')
        const fs   = require('fs')
        const MEDIA_BASE = path.resolve(process.cwd(), 'storage', 'media')

        const destPath    = urlToPath(media.url)
        const relativePath = destPath.replace(/^media\//, '')
        const srcBuffer = await fs.promises.readFile(path.join(MEDIA_BASE, relativePath))

        const { data: rotated, info } = await sharp(srcBuffer)
            .rotate(degrees)
            .toBuffer({ resolveWithObject: true })

        await uploadBuffer(rotated, destPath, media.mime_type || 'image/jpeg')

        const updates = { width: info.width, height: info.height }

        if (media.thumbnail_url) {
            const thumbPath = urlToPath(media.thumbnail_url)
            const thumbBuf  = await sharp(rotated)
                .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 75 })
                .toBuffer()
            updates.thumbnail_url = await uploadBuffer(thumbBuf, thumbPath, 'image/webp')
        }

        await media.update(updates)
        return res.status(200).json(await db.Media.findByPk(media.id))
    } catch (e) { next(e) }
});

module.exports = router;
