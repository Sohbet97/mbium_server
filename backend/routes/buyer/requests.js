const router             = require('express').Router()
const ApiError           = require('../../exceptions/api-error')
const { FUNCTIONS }      = require('../../utils/functions')
const BuyerRequestService = require('../../__modules__/buyer-requests/services/buyer-requests')
const BuyerRequestOfferService = require('../../__modules__/buyer-requests/services/buyer-request-offers')
const { OFFER_FROM_ROLE } = require('../../__modules__/buyer-requests/models/BuyerRequestOffer.model')
const { inferFileType }   = require('../../__modules__/buyer-requests/services/attachment-helpers')
const { attachmentUpload } = require('../../utils/upload')
const db = require('../../models')

// POST /buyer/requests/attachments/upload — upload one file, get back a URL to reference
// in POST /buyer/requests or an offer counter's `attachments` array.
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
// Body: { text?, attachments?: {url, file_type?, mime_type?, original_name?, size?}[], city_id?, product_id?, shop_id?, budget?, quantity? }
// At least one of text or attachments must be provided.
router.post('/', async (req, res, next) => {
    try {
        const { text, attachments, city_id, product_id, shop_id, budget, quantity } = req.body

        const hasText        = text && String(text).trim().length > 0
        const hasAttachments = Array.isArray(attachments) && attachments.length > 0
        if (!hasText && !hasAttachments) {
            throw ApiError.BadRequest('text ýa-da attachments hökman (azyndan biri)')
        }

        if (product_id) {
            if (!shop_id) throw ApiError.BadRequest('product_id üçin shop_id hökman')
            const product = await db.Product.findOne({ where: { id: product_id, shop_id } })
            if (!product) throw ApiError.BadRequest('Haryt bu dükana degişli däl')
        }

        const model = await BuyerRequestService.create({
            user_id:  req.user.id,
            city_id:  city_id  || null,
            product_id: product_id || null,
            shop_id:  shop_id  || null,
            text:     hasText ? String(text).trim() : null,
            attachments: hasAttachments ? attachments : [],
            budget:   budget   || null,
            quantity: quantity  || 1,
        })

        // Notify matching shops (fire-and-forget)
        BuyerRequestService.notifyMatchingShops(model, req.app.io).catch(() => {})

        return res.status(201).json({ model })
    } catch (e) { next(e) }
})

// GET /buyer/requests/:id/offers — own request's offer thread
router.get('/:id/offers', async (req, res, next) => {
    try {
        const request = await BuyerRequestService.getById(req.params.id)
        if (!request || request.user_id !== req.user.id) throw ApiError.NotFound('Sorag tapylmady')
        const data = await BuyerRequestOfferService.getByRequest(req.params.id)
        return res.json({ data })
    } catch (e) { next(e) }
})

// POST /buyer/requests/:id/offers/:offerId/counter
router.post('/:id/offers/:offerId/counter', async (req, res, next) => {
    try {
        const { unit_price, quantity, note, expires_at, attachments } = req.body
        if (!unit_price) throw ApiError.BadRequest('unit_price hökman')
        const model = await BuyerRequestOfferService.counterOffer({
            offer_id: req.params.offerId,
            actor: OFFER_FROM_ROLE.BUYER,
            userId: req.user.id,
            unit_price, quantity, note, expires_at, attachments,
        }, req.app.io)
        return res.status(201).json({ model })
    } catch (e) { next(e) }
})

// PATCH /buyer/requests/:id/offers/:offerId/accept
router.patch('/:id/offers/:offerId/accept', async (req, res, next) => {
    try {
        const model = await BuyerRequestOfferService.acceptOffer({
            offer_id: req.params.offerId,
            actor: OFFER_FROM_ROLE.BUYER,
            userId: req.user.id,
        }, req.app.io)
        return res.json({ model })
    } catch (e) { next(e) }
})

// PATCH /buyer/requests/:id/offers/:offerId/reject
router.patch('/:id/offers/:offerId/reject', async (req, res, next) => {
    try {
        const model = await BuyerRequestOfferService.rejectOffer({
            offer_id: req.params.offerId,
            actor: OFFER_FROM_ROLE.BUYER,
            userId: req.user.id,
        }, req.app.io)
        return res.json({ model })
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
