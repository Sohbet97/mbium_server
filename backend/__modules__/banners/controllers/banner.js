const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const BannerService = require("../services/banners");

class BannerController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = BannerService.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                BannerService.get(filter, limit, skip, paranoid),
                BannerService.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await BannerService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Banner tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const model = await BannerService.create(req.body);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const existing = await BannerService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Banner tapylmady");
            const model = await BannerService.update(req.params.id, req.body);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await BannerService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await BannerService.delete(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            await BannerService.restore(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = BannerController;
