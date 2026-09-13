const ColorService = require("../services/ColorService");
const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");

class ColorController {
    static async getAll(req, res, next) {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const filter = ColorService.buildFilter(req.query);
            const result = await ColorService.getAll(filter, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const color = await ColorService.getById(req.params.id);
            if (!color) throw ApiError.NotFound("Reňk tapylmady");
            res.json({ model: color });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            if (!req.body?.name?.trim()) throw ApiError.BadRequest("name is required");
            if (!req.body?.hex) throw ApiError.BadRequest("hex is required");
            const color = await ColorService.create(req.body);
            res.status(201).json({ model: color });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const color = await ColorService.update(req.params.id, req.body);
            res.json({ model: color });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await ColorService.delete(req.params.id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }
}

module.exports = ColorController;
