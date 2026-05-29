const SupplierService = require("../services/SupplierService");
const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");

class SupplierController {
    static async getAll(req, res, next) {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const filter = SupplierService.buildFilter(req.query);
            const result = await SupplierService.getAll(filter, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const supplier = await SupplierService.getById(req.params.id);
            if (!supplier) throw ApiError.NotFound("Supplier not found");
            res.json({ model: supplier });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            if (!req.body?.name?.trim()) throw ApiError.BadRequest("name is required");
            const supplier = await SupplierService.create(req.body);
            res.status(201).json({ model: supplier });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const supplier = await SupplierService.update(req.params.id, req.body);
            res.json({ model: supplier });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await SupplierService.delete(req.params.id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }
}

module.exports = SupplierController;
