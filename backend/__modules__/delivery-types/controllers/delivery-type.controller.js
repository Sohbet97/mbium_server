const DeliveryTypeService = require("../services/DeliveryTypeService");
const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");

class DeliveryTypeController {
    static async getAll(req, res, next) {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const filter = {};
            if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === "true";
            const result = await DeliveryTypeService.getAll(filter, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const deliveryType = await DeliveryTypeService.getById(req.params.id);
            if (!deliveryType) throw ApiError.NotFound("Delivery type not found");
            res.json({ model: deliveryType });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            if (!req.body?.name?.trim()) throw ApiError.BadRequest("name is required");
            if (!req.body?.code?.trim()) throw ApiError.BadRequest("code is required");
            const deliveryType = await DeliveryTypeService.create(req.body);
            res.status(201).json({ model: deliveryType });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const deliveryType = await DeliveryTypeService.update(req.params.id, req.body);
            res.json({ model: deliveryType });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await DeliveryTypeService.delete(req.params.id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }
}

module.exports = DeliveryTypeController;
