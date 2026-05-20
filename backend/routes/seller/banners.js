const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const db = require('../../models');
const { BannerService } = require('../../__modules__/banners/services/banners');

// GET /seller/banners
router.get('/', async (req, res, next) => {
    try {
        const filter = { shop_id: req.shop.id };
        const [data, count] = await Promise.all([
            BannerService.get(filter),
            BannerService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// POST /seller/banners
router.post('/', async (req, res, next) => {
    try {
        const { title, subtitle, media_id, image_url, link_url, button_text, button_url, starts_at, ends_at, is_active } = req.body;
        if (!title?.trim()) throw ApiError.BadRequest('Başlyk hökmany');
        const model = await BannerService.create({
            shop_id: req.shop.id,
            title, subtitle, media_id: media_id || null, image_url, link_url,
            button_text, button_url, starts_at: starts_at || null, ends_at: ends_at || null,
            is_active: is_active !== false,
        });
        const full = await BannerService.getById(model.id);
        return res.status(201).json({ model: full });
    } catch (e) { next(e); }
});

// PUT /seller/banners/:id
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await db.Banner.findOne({ where: { id: req.params.id, shop_id: req.shop.id } });
        if (!existing) throw ApiError.NotFound('Banner tapylmady');
        const { title, subtitle, media_id, image_url, link_url, button_text, button_url, starts_at, ends_at, is_active } = req.body;
        const model = await BannerService.update(existing.id, {
            title, subtitle, media_id: media_id || null, image_url, link_url,
            button_text, button_url, starts_at: starts_at || null, ends_at: ends_at || null,
            is_active,
        });
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// DELETE /seller/banners/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await db.Banner.findOne({ where: { id: req.params.id, shop_id: req.shop.id } });
        if (!existing) throw ApiError.NotFound('Banner tapylmady');
        await BannerService.delete(existing.id);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

module.exports = router;
