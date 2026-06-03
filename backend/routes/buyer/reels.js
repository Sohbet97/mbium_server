const router      = require('express').Router()
const ReelService = require('../../__modules__/reels/services/reels')
const { FUNCTIONS } = require('../../utils/functions')

// GET /buyer/reels  — paginated public feed (active reels from active shops)
router.get('/', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const filter = { is_active: true }
        if (req.query.shop_id) filter.shop_id = req.query.shop_id

        const [data, count] = await Promise.all([
            ReelService.get(filter, limit, skip, req.query.sort),
            ReelService.getCount(filter),
        ])
        return res.json({ data, count })
    } catch (e) { next(e) }
})

// GET /buyer/reels/:id  — single reel + increment view count
router.get('/:id', async (req, res, next) => {
    try {
        const model = await ReelService.getById(req.params.id)
        if (!model || !model.is_active) return res.status(404).json({ message: 'Reel tapylmady' })
        ReelService.incrementViews(model.id).catch(() => {})
        return res.json({ model })
    } catch (e) { next(e) }
})

module.exports = router
