const router          = require('express').Router()
const ReelService     = require('../../__modules__/reels/services/reels')
const ReelGiftService = require('../../__modules__/reels/services/reelGifts')
const ApiError        = require('../../exceptions/api-error')
const { FUNCTIONS }   = require('../../utils/functions')
const authorizationMiddleware = require('../../middlewares/authorization-middleware')

// GET /buyer/reels  — paginated public feed (active reels from active shops)
router.get('/', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const filter = { is_active: true, moderation_status: 1 }
        if (req.query.shop_id) filter.shop_id = req.query.shop_id

        const [data, count] = await Promise.all([
            ReelService.get(filter, limit, skip, req.query.sort),
            ReelService.getCount(filter),
        ])
        return res.json({ data, count })
    } catch (e) { next(e) }
})

// GET /buyer/reels/gift-types  — catalog of purchasable gifts
// Registered before GET /:id so Express doesn't parse 'gift-types' as a reel id.
router.get('/gift-types', async (req, res, next) => {
    try {
        const data = await ReelGiftService.getGiftTypes()
        return res.json({ data })
    } catch (e) { next(e) }
})

// GET /buyer/reels/:id  — single reel + increment view count
router.get('/:id', async (req, res, next) => {
    try {
        const model = await ReelService.getById(req.params.id)
        if (!model || !model.is_active || model.moderation_status !== 1) return res.status(404).json({ message: 'Reel tapylmady' })
        ReelService.incrementViews(model.id).catch(() => {})
        return res.json({ model })
    } catch (e) { next(e) }
})

// POST /buyer/reels/:id/like
router.post('/:id/like', authorizationMiddleware, async (req, res, next) => {
    try {
        const result = await ReelService.like(req.user.id, req.params.id)
        return res.status(result.created ? 201 : 200).json({ liked: true })
    } catch (e) { next(e) }
})

// DELETE /buyer/reels/:id/like
router.delete('/:id/like', authorizationMiddleware, async (req, res, next) => {
    try {
        await ReelService.unlike(req.user.id, req.params.id)
        return res.json({ liked: false })
    } catch (e) { next(e) }
})

// GET /buyer/reels/:id/gifts  — gifts received on a reel
router.get('/:id/gifts', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const { rows: data, count } = await ReelGiftService.getReelGifts(req.params.id, limit, skip)
        return res.json({ data, count })
    } catch (e) { next(e) }
})

// POST /buyer/reels/:id/gifts  — send a gift
// Body: { gift_type_id, message? }
router.post('/:id/gifts', authorizationMiddleware, async (req, res, next) => {
    try {
        const { gift_type_id, message } = req.body
        if (!gift_type_id) throw ApiError.BadRequest('gift_type_id hökman')
        const gift = await ReelGiftService.sendGift(req.user.id, req.params.id, gift_type_id, message)
        return res.status(201).json({ model: gift })
    } catch (e) { next(e) }
})

module.exports = router
