const GuideService = require("../services/GuideService");
const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");

const parseId = (v) => {
    const id = Number(v);
    if (!Number.isInteger(id) || id <= 0) throw ApiError.BadRequest("Invalid id");
    return id;
};

class GuideController {
    static async getAll(req, res, next) {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const filter = {};
            if (req.query.status !== undefined && req.query.status !== "") filter.status = Number(req.query.status);
            const result = await GuideService.getAll(filter, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await GuideService.getById(parseId(req.params.id));
            if (!model) throw ApiError.NotFound("Gollanma tapylmady");
            res.json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            res.status(201).json({ model: await GuideService.create(req.body) });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            res.json({ model: await GuideService.update(parseId(req.params.id), req.body) });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await GuideService.delete(parseId(req.params.id));
            res.json({ success: true });
        } catch (e) { next(e); }
    }

    // GET /guide — public, published only
    static async listPublished(req, res, next) {
        try {
            res.json({ data: await GuideService.getPublished() });
        } catch (e) { next(e); }
    }
}

module.exports = GuideController;
