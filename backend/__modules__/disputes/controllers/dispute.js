const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const DisputeService = require("../services/disputes");
const { disputeSchema, disputeStatusSchema } = require("../validators/dispute.schema");

class DisputeController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = DisputeService.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                DisputeService.get(filter, limit, skip, paranoid),
                DisputeService.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await DisputeService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Jedel tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            await disputeSchema.validate(req.body, { abortEarly: false });
            const model = await DisputeService.create({
                ...req.body,
                opened_by: req.user?.id ?? null,
            });
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async updateStatus(req, res, next) {
        try {
            await disputeStatusSchema.validate(req.body, { abortEarly: false });
            const existing = await DisputeService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Jedel tapylmady");
            const model = await DisputeService.updateStatus(
                req.params.id,
                req.body.status,
                req.body.resolution,
                req.user?.id
            );
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await DisputeService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await DisputeService.delete(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            await DisputeService.restore(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = DisputeController;
