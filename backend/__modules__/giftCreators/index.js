const router            = require('express').Router()
const routeGuard        = require('../../middlewares/route-guard')
const Permissions       = require('../../utils/permissions')
const ApiError          = require('../../exceptions/api-error')
const { FUNCTIONS }     = require('../../utils/functions')
const GiftCreatorService = require('./services/giftCreators')

router.use(routeGuard({
    GET:    Permissions.GIFT_CREATOR_GET,
    POST:   Permissions.GIFT_CREATOR_POST,
    PUT:    Permissions.GIFT_CREATOR_PUT,
    DELETE: Permissions.GIFT_CREATOR_DELETE,
}))

// GET /admin/gift-creators
router.get('/gift-creators', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const { rows: data, count } = await GiftCreatorService.get({}, limit, skip)
        return res.json({ data, count })
    } catch (e) { next(e) }
})

// GET /admin/gift-creators/:id
router.get('/gift-creators/:id', async (req, res, next) => {
    try {
        const model = await GiftCreatorService.getById(req.params.id)
        if (!model) throw ApiError.NotFound('Sowgat awtory tapylmady')
        return res.json({ model })
    } catch (e) { next(e) }
})

// GET /admin/gift-creators/:id/transactions — revenue history for the "gifts" admin page
router.get('/gift-creators/:id/transactions', async (req, res, next) => {
    try {
        const existing = await GiftCreatorService.getById(req.params.id)
        if (!existing) throw ApiError.NotFound('Sowgat awtory tapylmady')
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const { rows: data, count } = await GiftCreatorService.getTransactions(req.params.id, limit, skip)
        return res.json({ data, count })
    } catch (e) { next(e) }
})

// POST /admin/gift-creators
router.post('/gift-creators', async (req, res, next) => {
    try {
        const { name, avatar_id, contact_note } = req.body
        if (!name) throw ApiError.BadRequest('Ady hökman')
        const model = await GiftCreatorService.create({ name, avatar_id, contact_note })
        return res.status(201).json({ model })
    } catch (e) { next(e) }
})

// PUT /admin/gift-creators/:id
router.put('/gift-creators/:id', async (req, res, next) => {
    try {
        const model = await GiftCreatorService.update(req.params.id, req.body)
        return res.json({ model })
    } catch (e) { next(e) }
})

// DELETE /admin/gift-creators/:id
router.delete('/gift-creators/:id', async (req, res, next) => {
    try {
        await GiftCreatorService.delete(req.params.id)
        return res.sendStatus(200)
    } catch (e) { next(e) }
})

module.exports = router
