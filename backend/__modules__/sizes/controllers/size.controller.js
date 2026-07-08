const SizeService = require("../services/SizeService");
const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");

class SizeController {
    static async getAll(req, res, next) {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const filter = {};
            if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === "true";
            const result = await SizeService.getAll(filter, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }

    static async getTree(req, res, next) {
        try {
            const tree = await SizeService.getTree();
            res.json({ data: tree });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const size = await SizeService.getById(req.params.id);
            if (!size) throw ApiError.NotFound("Size not found");
            res.json({ model: size });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            if (!req.body?.name?.trim()) throw ApiError.BadRequest("name is required");
            const size = await SizeService.create(req.body);
            res.status(201).json({ model: size });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const size = await SizeService.update(req.params.id, req.body);
            res.json({ model: size });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await SizeService.delete(req.params.id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }
}

module.exports = SizeController;
