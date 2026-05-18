const ApiError = require("../../../exceptions/api-error");
const Validator = require("../../../__artefacts__/_validator_");
const { FUNCTIONS } = require("../../../utils/functions");
const DeliverService = require("../services/DeliverService");
const deliverSchema = require("../validators/deliver.scheme");

class DeliverController {
    static async get(req, res, next) {
        try {
            const filter = DeliverService.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                DeliverService.getAll(filter, limit, skip),
                DeliverService.getCount(filter),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await DeliverService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Kurýer tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(deliverSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await DeliverService.create(req.body);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const existing = await DeliverService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Kurýer tapylmady");
            const { isError, errors } = await Validator.validate(deliverSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            await DeliverService.update(req.params.id, req.body);
            const model = await DeliverService.getById(req.params.id);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await DeliverService.remove(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await DeliverService.forceDelete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = DeliverController;
