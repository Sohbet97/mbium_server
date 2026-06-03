const router             = require('express').Router()
const ApiError           = require('../../exceptions/api-error')
const { FUNCTIONS }      = require('../../utils/functions')
const BuyerRequestService = require('../../__modules__/buyer-requests/services/buyer-requests')

// GET /buyer/requests  — own requests
router.get('/', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const filter = { user_id: req.user.id }
        if (req.query.status !== undefined) filter.status = req.query.status

        const [data, count] = await Promise.all([
            BuyerRequestService.get(filter, limit, skip),
            BuyerRequestService.getCount(filter),
        ])
        return res.json({ data, count })
    } catch (e) { next(e) }
})

// GET /buyer/requests/:id
router.get('/:id', async (req, res, next) => {
    try {
        const model = await BuyerRequestService.getById(req.params.id)
        if (!model || model.user_id !== req.user.id) throw ApiError.NotFound('Sorag tapylmady')
        return res.json({ model })
    } catch (e) { next(e) }
})

// POST /buyer/requests
// Body: { text?, images?: string[], city_id?, budget?, quantity? }
// At least one of text or images must be provided.
router.post('/', async (req, res, next) => {
    try {
        const { text, images, city_id, budget, quantity } = req.body

        const hasText   = text   && String(text).trim().length > 0
        const hasImages = Array.isArray(images) && images.length > 0
        if (!hasText && !hasImages) {
            throw ApiError.BadRequest('text ýa-da images hökman (azyndan biri)')
        }

        const model = await BuyerRequestService.create({
            user_id:  req.user.id,
            city_id:  city_id  || null,
            text:     hasText ? String(text).trim() : null,
            images:   hasImages ? images : [],
            budget:   budget   || null,
            quantity: quantity  || 1,
        })

        // Notify matching shops (fire-and-forget)
        BuyerRequestService.notifyMatchingShops(model, req.app.io).catch(() => {})

        return res.status(201).json({ model })
    } catch (e) { next(e) }
})

// PATCH /buyer/requests/:id/close  — close own request
router.patch('/:id/close', async (req, res, next) => {
    try {
        const [affected] = await BuyerRequestService.close(req.params.id, req.user.id)
        if (!affected) throw ApiError.NotFound('Sorag tapylmady')
        return res.json({ ok: true })
    } catch (e) { next(e) }
})

// DELETE /buyer/requests/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const deleted = await BuyerRequestService.delete(req.params.id, req.user.id)
        if (!deleted) throw ApiError.NotFound('Sorag tapylmady')
        return res.sendStatus(200)
    } catch (e) { next(e) }
})

module.exports = router
