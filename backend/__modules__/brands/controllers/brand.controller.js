const BrandService = require("../services/BrandService");
const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");

class BrandController {
    static async getAll(req, res, next) {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const filter = {};
            if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === "true";
            const result = await BrandService.getAll(filter, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }

    static async getTree(req, res, next) {
        try {
            const tree = await BrandService.getTree();
            res.json({ data: tree });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const brand = await BrandService.getById(req.params.id);
            if (!brand) throw ApiError.NotFound("Brand not found");
            res.json({ model: brand });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            if (!req.body?.name?.trim()) throw ApiError.BadRequest("name is required");
            const brand = await BrandService.create(req.body);
            res.status(201).json({ model: brand });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const brand = await BrandService.update(req.params.id, req.body);
            res.json({ model: brand });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await BrandService.delete(req.params.id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }
}

module.exports = BrandController;
