const router          = require('express').Router()
const ApiError        = require('../../exceptions/api-error')
const db              = require('../../models')
const ReelService     = require('../../__modules__/reels/services/reels')
const ReelGiftService = require('../../__modules__/reels/services/reelGifts')
const { FUNCTIONS }   = require('../../utils/functions')
const PlanLimits      = require('../../services/plan-limits')

// GET /seller/reels  — own shop's reels
router.get('/', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const filter = { shop_id: req.shop.id }
        if (req.query.is_active !== undefined) filter.is_active = req.query.is_active

        const [data, count, { used, quota }] = await Promise.all([
            ReelService.get(filter, limit, skip, req.query.sort),
            ReelService.getCount(filter),
            PlanLimits.getUsage(req.shop, 'reel_monthly'),
        ])
        return res.json({ data, count, used, quota })
    } catch (e) { next(e) }
})

// GET /seller/reels/:id
router.get('/:id', async (req, res, next) => {
    try {
        const model = await ReelService.getById(req.params.id)
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound('Reel tapylmady')
        return res.json({ model })
    } catch (e) { next(e) }
})

// POST /seller/reels
// Body: { video_id, thumbnail_id?, caption?, product_id? }
// Flow: 1) POST /seller/media/upload → video_id
//       2) POST /seller/media/upload → thumbnail_id (optional)
//       3) POST /seller/reels        → create reel
router.post('/', async (req, res, next) => {
    try {
        const { video_id, thumbnail_id, caption, product_id } = req.body
        if (!video_id) throw ApiError.BadRequest('video_id hökman')

        const used = await PlanLimits.getMonthlyUsage(req.shop.id, 'reel_monthly')
        PlanLimits.assertQuota(req.shop.plan, 'reel_monthly', used)

        // Verify the video belongs to this seller
        const video = await db.Media.findOne({ where: { id: video_id, uploaded_by: req.user.id } })
        if (!video) throw ApiError.NotFound('Media tapylmady ýa-da siziňki däl')
        if (video.type !== 'video') throw ApiError.BadRequest('Diňe wideo faýl rugsat edilýär')

        // Verify thumbnail belongs to seller (if provided)
        if (thumbnail_id) {
            const thumb = await db.Media.findOne({ where: { id: thumbnail_id, uploaded_by: req.user.id } })
            if (!thumb) throw ApiError.NotFound('Thumbnail tapylmady ýa-da siziňki däl')
        }

        // Verify product belongs to this shop (if provided)
        if (product_id) {
            const product = await db.Product.findOne({ where: { id: product_id, shop_id: req.shop.id } })
            if (!product) throw ApiError.NotFound('Haryt tapylmady')
        }

        // New seller reels always start pending moderator review — a seller
        // can't self-approve by passing moderation_status in the request body
        const model = await ReelService.create({
            shop_id:      req.shop.id,
            video_id,
            thumbnail_id: thumbnail_id || null,
            caption:      caption      || null,
            product_id:   product_id   || null,
            moderation_status: 0,
        })

        return res.status(201).json({ model })
    } catch (e) { next(e) }
})

// PUT /seller/reels/:id  — update caption, thumbnail, product link, active status
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await ReelService.getById(req.params.id)
        if (!existing || existing.shop_id !== req.shop.id) throw ApiError.NotFound('Reel tapylmady')

        const { thumbnail_id, caption, product_id, is_active } = req.body

        if (thumbnail_id) {
            const thumb = await db.Media.findOne({ where: { id: thumbnail_id, uploaded_by: req.user.id } })
            if (!thumb) throw ApiError.NotFound('Thumbnail tapylmady ýa-da siziňki däl')
        }

        if (product_id) {
            const product = await db.Product.findOne({ where: { id: product_id, shop_id: req.shop.id } })
            if (!product) throw ApiError.NotFound('Haryt tapylmady')
        }

        await ReelService.update(req.params.id, { thumbnail_id, caption, product_id, is_active })
        return res.json({ ok: true })
    } catch (e) { next(e) }
})

// GET /seller/reels/:id/gifts — gifts received on one of this shop's reels (read-only;
// shops don't get a revenue share from gifts, this is engagement visibility only)
router.get('/:id/gifts', async (req, res, next) => {
    try {
        const reel = await ReelService.getById(req.params.id)
        if (!reel || reel.shop_id !== req.shop.id) throw ApiError.NotFound('Reel tapylmady')
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const { rows: data, count } = await ReelGiftService.getReelGifts(req.params.id, limit, skip)
        return res.json({ data, count })
    } catch (e) { next(e) }
})

// DELETE /seller/reels/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await ReelService.getById(req.params.id)
        if (!existing || existing.shop_id !== req.shop.id) throw ApiError.NotFound('Reel tapylmady')
        await ReelService.delete(req.params.id)
        return res.sendStatus(200)
    } catch (e) { next(e) }
})

module.exports = router
