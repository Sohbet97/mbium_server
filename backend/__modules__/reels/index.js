const router           = require('express').Router()
const routeGuard       = require('../../middlewares/route-guard')
const Permissions      = require('../../utils/permissions')
const ApiError         = require('../../exceptions/api-error')
const ReelService      = require('./services/reels')
const { FUNCTIONS }    = require('../../utils/functions')

router.use(routeGuard({
    GET:    Permissions.REEL_GET,
    POST:   Permissions.REEL_POST,
    PUT:    Permissions.REEL_PUT,
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

// PUT /admin/reels/:id  (admin can toggle is_active, edit caption)
router.put('/reels/:id', async (req, res, next) => {
    try {
        const model = await ReelService.getById(req.params.id)
        if (!model) throw ApiError.NotFound('Reel tapylmady')
        await ReelService.update(req.params.id, req.body)
        return res.json({ ok: true })
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
