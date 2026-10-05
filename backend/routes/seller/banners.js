const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const db = require('../../models');
const { BannerService } = require('../../__modules__/banners/services/banners');
const { BANNER_STATUSES } = require('../../__modules__/banners/models/Banner.model');

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

// GET /seller/banners/types  – placements the seller can buy, with per-day prices
router.get('/types', async (req, res, next) => {
    try {
        const data = await BannerService.getPurchasableTypes();
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// POST /seller/banners  – buy a banner: charges the seller and creates a PENDING banner
// Body: { title, banner_type_id, duration_days, currency: 'COIN'|'TMT', subtitle?, media_id?, image_url?, link_url?, button_text?, button_url? }
router.post('/', async (req, res, next) => {
    try {
        if (!req.body.title?.trim()) throw ApiError.BadRequest('Başlyk hökmany');
        const model = await BannerService.purchase({
            userId: req.user.id,
            shopId: req.shop.id,
            body: req.body,
        });
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

// PUT /seller/banners/:id  – content only; placement, days and price are fixed at purchase.
// Editing an approved banner sends it back to moderation.
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await db.Banner.findOne({ where: { id: req.params.id, shop_id: req.shop.id } });
        if (!existing) throw ApiError.NotFound('Banner tapylmady');
        if (existing.status === BANNER_STATUSES.REJECTED) throw ApiError.BadRequest('Ret edilen banneri üýtgetmek bolmaýar');

        const { title, subtitle, media_id, image_url, link_url, button_text, button_url, is_active } = req.body;
        const patch = { title, subtitle, media_id: media_id || null, image_url, link_url, button_text, button_url };

        const contentChanged = ['title', 'subtitle', 'image_url', 'link_url', 'button_text', 'button_url']
            .some((k) => req.body[k] !== undefined && (req.body[k] ?? '') !== (existing[k] ?? ''))
            || (req.body.media_id !== undefined && (media_id || null) !== existing.media_id);

        if (existing.status === BANNER_STATUSES.PENDING) {
            // still waiting for moderation – content edits are fine, it stays inactive
        } else if (contentChanged) {
            patch.status = BANNER_STATUSES.PENDING;
            patch.is_active = false;
        } else if (is_active !== undefined) {
            patch.is_active = is_active;
        }

        const model = await BannerService.update(existing.id, patch);
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
