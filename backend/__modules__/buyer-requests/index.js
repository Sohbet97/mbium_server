const router              = require('express').Router()
const { FUNCTIONS }       = require('../../utils/functions')
const BuyerRequestService = require('./services/buyer-requests')

// Admin: GET /admin/buyer-requests
router.get('/buyer-requests', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const filter = {}
        if (req.query.user_id !== undefined) filter.user_id = req.query.user_id
        if (req.query.city_id !== undefined) filter.city_id = req.query.city_id
        if (req.query.status  !== undefined) filter.status  = req.query.status

        const [data, count] = await Promise.all([
            BuyerRequestService.get(filter, limit, skip),
            BuyerRequestService.getCount(filter),
        ])
        return res.json({ data, count })
    } catch (e) { next(e) }
})

// Admin: GET /admin/buyer-requests/:id
router.get('/buyer-requests/:id', async (req, res, next) => {
    try {
        const model = await BuyerRequestService.getById(req.params.id)
        if (!model) return res.status(404).json({ message: 'Sorag tapylmady' })
        return res.json({ model })
    } catch (e) { next(e) }
})

module.exports = router
