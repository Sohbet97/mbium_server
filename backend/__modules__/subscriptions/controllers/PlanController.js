const ApiError = require("../../../exceptions/api-error");
const Validator = require("../../../__artefacts__/_validator_");
const PlanService = require("../services/PlanService");
const { planSchema } = require("../validators/plan.scheme");

class PlanController {
    static async getAll(req, res, next) {
        try {
            const includeInactive = req.query.all === "true";
            const data = await PlanService.getAll(includeInactive);
            return res.status(200).json({ data });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await PlanService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Plan not found");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(planSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await PlanService.create(req.body);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const existing = await PlanService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Plan not found");
            const { isError, errors } = await Validator.validate(planSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            await PlanService.update(req.params.id, req.body);
            const model = await PlanService.getById(req.params.id);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async remove(req, res, next) {
        try {
            await PlanService.remove(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = PlanController;
