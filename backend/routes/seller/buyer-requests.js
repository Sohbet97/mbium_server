const router = require('express').Router()
const ApiError = require('../../exceptions/api-error')
const { FUNCTIONS } = require('../../utils/functions')
const BuyerRequestService = require('../../__modules__/buyer-requests/services/buyer-requests')
const BuyerRequestOfferService = require('../../__modules__/buyer-requests/services/buyer-request-offers')
const { OFFER_FROM_ROLE } = require('../../__modules__/buyer-requests/models/BuyerRequestOffer.model')
const { inferFileType } = require('../../__modules__/buyer-requests/services/attachment-helpers')
const { attachmentUpload } = require('../../utils/upload')

// POST /seller/buyer-requests/attachments/upload — upload one file, get back a URL to
// reference in an offer's `attachments` array.
router.post('/attachments/upload', attachmentUpload.single('file'), (req, res, next) => {
    try {
        if (!req.file) throw ApiError.BadRequest('Faýl saýlanmady')
        const url = `/static/buyer-request-attachments/${req.file.filename}`
        return res.status(201).json({
            url,
            file_type:     inferFileType(req.file.mimetype, req.file.originalname),
            mime_type:     req.file.mimetype,
            original_name: req.file.originalname,
            size:          req.file.size,
        })
    } catch (e) { next(e) }
})

// GET /seller/buyer-requests — requests relevant to this shop (direct or city-broadcast)
router.get('/', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const data = await BuyerRequestService.getForShop(req.shop, limit, skip)
        return res.json({ data })
    } catch (e) { next(e) }
})

// GET /seller/buyer-requests/:id — request detail + this shop's own offer thread
router.get('/:id', async (req, res, next) => {
    try {
        const request = await BuyerRequestService.getById(req.params.id)
        if (!request) throw ApiError.NotFound('Sorag tapylmady')
        const offers = await BuyerRequestOfferService.getByRequest(req.params.id, { forShopId: req.shop.id })
        return res.json({ model: request, offers })
    } catch (e) { next(e) }
})

// POST /seller/buyer-requests/:id/offers — submit initial priced offer
router.post('/:id/offers', async (req, res, next) => {
    try {
        const { product_id, variant_id, variant_size_id, unit_price, quantity, currency, note, expires_at, attachments } = req.body
        if (!unit_price) throw ApiError.BadRequest('unit_price hökman')
        const model = await BuyerRequestOfferService.createInitialOffer({
            buyer_request_id: req.params.id,
            shop_id: req.shop.id,
            product_id, variant_id, variant_size_id, unit_price, quantity, currency, note, expires_at, attachments,
        }, req.app.io)
        return res.status(201).json({ model })
    } catch (e) { next(e) }
})

// POST /seller/buyer-requests/:id/offers/:offerId/counter
router.post('/:id/offers/:offerId/counter', async (req, res, next) => {
    try {
        const { unit_price, quantity, note, expires_at, attachments } = req.body
        if (!unit_price) throw ApiError.BadRequest('unit_price hökman')
        const model = await BuyerRequestOfferService.counterOffer({
            offer_id: req.params.offerId,
            actor: OFFER_FROM_ROLE.SELLER,
            actorShopId: req.shop.id,
            unit_price, quantity, note, expires_at, attachments,
        }, req.app.io)
        return res.status(201).json({ model })
    } catch (e) { next(e) }
})

// PATCH /seller/buyer-requests/:id/offers/:offerId/accept
router.patch('/:id/offers/:offerId/accept', async (req, res, next) => {
    try {
        const model = await BuyerRequestOfferService.acceptOffer({
            offer_id: req.params.offerId,
            actor: OFFER_FROM_ROLE.SELLER,
            actorShopId: req.shop.id,
        }, req.app.io)
        return res.json({ model })
    } catch (e) { next(e) }
})

// PATCH /seller/buyer-requests/:id/offers/:offerId/reject
router.patch('/:id/offers/:offerId/reject', async (req, res, next) => {
    try {
        const model = await BuyerRequestOfferService.rejectOffer({
            offer_id: req.params.offerId,
            actor: OFFER_FROM_ROLE.SELLER,
            actorShopId: req.shop.id,
        }, req.app.io)
        return res.json({ model })
    } catch (e) { next(e) }
})

module.exports = router
