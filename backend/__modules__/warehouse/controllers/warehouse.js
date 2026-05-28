const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const WarehouseService = require("../services/warehouse");
const { warehouseSchema, warehouseUpdateSchema } = require("../validators/warehouse.schema");

class WarehouseController {
    static async get(req, res, next) {
        try {
            const filter = WarehouseService.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                WarehouseService.get(filter, limit, skip),
                WarehouseService.getCount(filter),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await WarehouseService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Ammar tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            await warehouseSchema.validate(req.body, { abortEarly: false });
            const model = await WarehouseService.create(req.body);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            await warehouseUpdateSchema.validate(req.body, { abortEarly: false });
            const model = await WarehouseService.update(req.params.id, req.body);
            if (!model) throw ApiError.NotFound("Ammar tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            const existing = await WarehouseService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Ammar tapylmady");
            await WarehouseService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = WarehouseController;
