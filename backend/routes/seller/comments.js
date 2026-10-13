const router = require('express').Router()
const { Op } = require('sequelize')
const db = require('../../models')
const ApiError = require('../../exceptions/api-error')
const { FUNCTIONS } = require('../../utils/functions')
const ReviewService = require('../../__modules__/reviews/services/reviews')

const AUTHOR_ATTRS = ['id', 'name', 'surname', 'thumbnail']

// Scoped to products of req.shop — a seller only ever sees/moderates comments and
// reviews left on their own shop's products.
const productInclude = (shopId) => ({
    model: db.Product, as: 'product', attributes: ['id', 'name'], where: { shop_id: shopId }, required: true,
})

async function findOwnComment(id, shopId) {
    const comment = await db.Comment.findOne({ where: { id }, include: [productInclude(shopId)] })
    if (!comment) throw ApiError.NotFound('Teswir tapylmady')
    return comment
}

async function findOwnReview(id, shopId) {
    const review = await db.Review.findOne({ where: { id }, include: [productInclude(shopId)] })
    if (!review) throw ApiError.NotFound('Syn tapylmady')
    return review
}

// GET /seller/comments?status=&product_id=&limit=&skip= — root comments with all replies
router.get('/', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const { status, product_id } = req.query
        const where = { parent_id: { [Op.or]: [null, 0] } }
        if (status) where.status = status

        const prodInclude = productInclude(req.shop.id)
        if (product_id) prodInclude.where.id = Number(product_id)

        const { rows, count } = await db.Comment.findAndCountAll({
            where,
            include: [
                { model: db.User, as: 'author', attributes: AUTHOR_ATTRS },
                prodInclude,
                {
                    model: db.Comment, as: 'replies', required: false,
                    include: [{ model: db.User, as: 'author', attributes: AUTHOR_ATTRS }],
                },
            ],
            distinct: true,
            order: [['createdAt', 'DESC'], [{ model: db.Comment, as: 'replies' }, 'createdAt', 'ASC']],
            limit,
            offset: skip,
        })
        return res.json({ data: rows, count })
    } catch (e) { next(e) }
})

// PATCH /seller/comments/:id/status — sellers may only hide (reject) a comment; approving stays with admin moderation
router.patch('/:id/status', async (req, res, next) => {
    try {
        if (req.body.status !== 'rejected') throw ApiError.BadRequest('Diňe "rejected" rugsat berilýär')
        const comment = await findOwnComment(req.params.id, req.shop.id)
        await comment.update({ status: 'rejected' })
        return res.json({ ok: true })
    } catch (e) { next(e) }
})

// POST /seller/comments/:id/reply { body } — replies to a root comment as the seller; auto-approved
router.post('/:id/reply', async (req, res, next) => {
    try {
        const body = req.body.body?.trim()
        if (!body) throw ApiError.BadRequest('Mazmuny giriziň')
        const parent = await findOwnComment(req.params.id, req.shop.id)
        if (parent.parent_id) throw ApiError.BadRequest('Diňe esasy teswire jogap berip bolýar')
        if (parent.status !== 'approved') throw ApiError.BadRequest('Tassyklanmadyk teswire jogap berip bolmaýar')
        const reply = await db.Comment.create({
            user_id: req.user.id, product_id: parent.product_id, parent_id: parent.id, body, status: 'approved',
        })
        return res.status(201).json({ model: reply })
    } catch (e) { next(e) }
})

// DELETE /seller/comments/:id — only the seller's own replies can be deleted
router.delete('/:id', async (req, res, next) => {
    try {
        const comment = await findOwnComment(req.params.id, req.shop.id)
        if (!comment.parent_id || comment.user_id !== req.user.id) throw ApiError.NotAllowed('Diňe öz jogabyňyzy pozup bilersiňiz')
        await comment.destroy()
        return res.json({ ok: true })
    } catch (e) { next(e) }
})

// GET /seller/comments/reviews?rating=&replied=&limit=&skip=
router.get('/reviews', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const { rating, replied } = req.query
        const where = { status: 1 }
        if (rating) where.rating = Number(rating)

        const replyInclude = { model: db.ReviewReply, as: 'reply', required: replied === 'true' }
        if (replied === 'false') { replyInclude.required = false; where['$reply.id$'] = null }

        const { rows, count } = await db.Review.findAndCountAll({
            where,
            include: [
                { model: db.User, as: 'author', attributes: AUTHOR_ATTRS },
                productInclude(req.shop.id),
                replyInclude,
            ],
            distinct: true,
            order: [['createdAt', 'DESC']],
            limit,
            offset: skip,
        })
        return res.json({ data: rows, count })
    } catch (e) { next(e) }
})

// POST /seller/comments/reviews/:id/reply { content }
router.post('/reviews/:id/reply', async (req, res, next) => {
    try {
        const content = req.body.content?.trim()
        if (!content) throw ApiError.BadRequest('Mazmuny giriziň')
        const review = await findOwnReview(req.params.id, req.shop.id)
        const model = await ReviewService.createReply(review.id, req.shop.id, content, req.user.id)
        return res.status(201).json({ model })
    } catch (e) { next(e) }
})

// DELETE /seller/comments/reviews/:id/reply
router.delete('/reviews/:id/reply', async (req, res, next) => {
    try {
        const review = await findOwnReview(req.params.id, req.shop.id)
        await ReviewService.deleteReply(review.id)
        return res.json({ ok: true })
    } catch (e) { next(e) }
})

module.exports = router
