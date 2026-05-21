const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const { FUNCTIONS } = require('../../utils/functions');
const ReviewService = require('../../__modules__/reviews/services/reviews');

// GET /buyer/reviews  – reviews authored by current user
router.get('/', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const filter = { user_id: req.user.id };
        if (req.query.product_id) filter.product_id = req.query.product_id;
        const [data, count] = await Promise.all([
            ReviewService.get(filter, limit, skip),
            ReviewService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// POST /buyer/reviews  – submit a review
// Body: { product_id, order_id?, rating (1-5), comment? }
router.post('/', async (req, res, next) => {
    try {
        const { product_id, rating } = req.body;
        if (!product_id) throw ApiError.BadRequest('product_id hökman');
        if (!rating || rating < 1 || rating > 5) throw ApiError.BadRequest('Baha 1-5 aralygynda bolmaly');
        const model = await ReviewService.create(req.user.id, req.body);
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

// DELETE /buyer/reviews/:id  – delete own review
router.delete('/:id', async (req, res, next) => {
    try {
        const review = await ReviewService.getById(req.params.id);
        if (!review || review.user_id !== req.user.id) throw ApiError.NotFound('Teswir tapylmady');
        await ReviewService.delete(req.params.id);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

module.exports = router;
