const { Op } = require("sequelize");
const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const Validator = require("../../../__artefacts__/_validator_");
const ReviewService = require("../services/reviews");
const reviewSchema = require("../validators/review.schema");

class ReviewController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = this.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                ReviewService.get(filter, limit, skip, paranoid),
                ReviewService.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await ReviewService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Teswir tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(reviewSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await ReviewService.create(req.user?.id, req.body);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            if (status === undefined) throw ApiError.BadRequest("Status talap edilýär");
            await ReviewService.updateStatus(req.params.id, status);
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await ReviewService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await ReviewService.delete(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async getReply(req, res, next) {
        try {
            const reply = await ReviewService.getReply(req.params.id);
            if (!reply) throw ApiError.NotFound("Jogap tapylmady");
            return res.status(200).json({ model: reply });
        } catch (e) { next(e); }
    }

    static async createReply(req, res, next) {
        try {
            const { shop_id, content } = req.body;
            if (!shop_id) throw ApiError.BadRequest("Dükan saýlaň");
            if (!content?.trim()) throw ApiError.BadRequest("Mazmuny giriziň");
            const review = await ReviewService.getById(req.params.id);
            if (!review) throw ApiError.NotFound("Teswir tapylmady");
            const model = await ReviewService.createReply(req.params.id, shop_id, content, req.user?.id);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async deleteReply(req, res, next) {
        try {
            await ReviewService.deleteReply(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static getFilter({ product_id, user_id, status, paranoid } = {}) {
        const filter = {};
        if (product_id) filter.product_id = product_id;
        if (user_id) filter.user_id = user_id;
        if (status !== undefined) filter.status = status;
        if (paranoid) filter.deletedAt = { [Op.ne]: null };
        return filter;
    }
}

module.exports = ReviewController;
