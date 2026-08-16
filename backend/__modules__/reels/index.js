const router           = require('express').Router()
const routeGuard       = require('../../middlewares/route-guard')
const Permissions      = require('../../utils/permissions')
const ApiError         = require('../../exceptions/api-error')
const db               = require('../../models')
const ReelService      = require('./services/reels')
const { FUNCTIONS }    = require('../../utils/functions')

router.use(routeGuard({
    GET:    Permissions.REEL_GET,
    POST:   Permissions.REEL_POST,
    PUT:    Permissions.REEL_PUT,
    PATCH:  Permissions.REEL_PUT,
    DELETE: Permissions.REEL_DELETE,
}))

// GET /admin/reels
router.get('/reels', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const filter = {}
        if (req.query.shop_id)  filter.shop_id  = req.query.shop_id
        if (req.query.is_active !== undefined) filter.is_active = req.query.is_active

        const [data, count] = await Promise.all([
            ReelService.get(filter, limit, skip, req.query.sort),
            ReelService.getCount(filter),
        ])
        return res.json({ data, count })
    } catch (e) { next(e) }
})

// GET /admin/reels/:id
router.get('/reels/:id', async (req, res, next) => {
    try {
        const model = await ReelService.getById(req.params.id)
        if (!model) throw ApiError.NotFound('Reel tapylmady')
        return res.json({ model })
    } catch (e) { next(e) }
})

// POST /admin/reels — admin can create a reel directly for any shop
router.post('/reels', async (req, res, next) => {
    try {
        const { shop_id, video_id, thumbnail_id, caption, product_id } = req.body
        if (!shop_id) throw ApiError.BadRequest('shop_id hökman')
        if (!video_id) throw ApiError.BadRequest('video_id hökman')

        const shop = await db.Shop.findByPk(shop_id)
        if (!shop) throw ApiError.NotFound('Dükan tapylmady')

        const video = await db.Media.findByPk(video_id)
        if (!video || video.type !== 'video') throw ApiError.BadRequest('Video tapylmady ýa-da nädogry görnüş')

        if (thumbnail_id) {
            const thumb = await db.Media.findByPk(thumbnail_id)
            if (!thumb) throw ApiError.NotFound('Thumbnail tapylmady')
        }

        if (product_id) {
            const product = await db.Product.findOne({ where: { id: product_id, shop_id } })
            if (!product) throw ApiError.NotFound('Haryt tapylmady')
        }

        // Reels created directly by an admin/moderator don't need self-review
        const moderation_status = req.body.moderation_status === undefined ? 1 : req.body.moderation_status

        const model = await ReelService.create({
            shop_id,
            video_id,
            thumbnail_id: thumbnail_id || null,
            caption:      caption      || null,
            product_id:   product_id   || null,
            moderation_status,
        })
        return res.status(201).json({ model })
    } catch (e) { next(e) }
})

// PUT /admin/reels/:id  (admin can toggle is_active, edit caption)
router.put('/reels/:id', async (req, res, next) => {
    try {
        const model = await ReelService.getById(req.params.id)
        if (!model) throw ApiError.NotFound('Reel tapylmady')
        await ReelService.update(req.params.id, req.body)
        return res.json({ ok: true })
    } catch (e) { next(e) }
})

// PATCH /admin/reels/:id/approve
router.patch('/reels/:id/approve', async (req, res, next) => {
    try {
        const existing = await ReelService.getById(req.params.id)
        if (!existing) throw ApiError.NotFound('Reel tapylmady')
        const model = await ReelService.approve(req.params.id, req.user?.id)
        return res.json({ model })
    } catch (e) { next(e) }
})

// PATCH /admin/reels/:id/reject
router.patch('/reels/:id/reject', async (req, res, next) => {
    try {
        const existing = await ReelService.getById(req.params.id)
        if (!existing) throw ApiError.NotFound('Reel tapylmady')
        const model = await ReelService.reject(req.params.id, req.user?.id, req.body?.note)
        return res.json({ model })
    } catch (e) { next(e) }
})

// DELETE /admin/reels/:id
router.delete('/reels/:id', async (req, res, next) => {
    try {
        const force = req.query.force === 'true'
        await ReelService.delete(req.params.id, force)
        return res.sendStatus(200)
    } catch (e) { next(e) }
})

module.exports = router
