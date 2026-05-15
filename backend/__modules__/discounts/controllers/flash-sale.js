const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const FlashSaleService = require("../services/flash-sales");
const { flashSaleSchema } = require("../validators/flash-sale.schema");

class FlashSaleController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = FlashSaleService.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                FlashSaleService.get(filter, limit, skip, paranoid),
                FlashSaleService.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await FlashSaleService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Flash sale tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            await flashSaleSchema.validate(req.body, { abortEarly: false });
            const model = await FlashSaleService.create(req.body);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const existing = await FlashSaleService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Flash sale tapylmady");
            const model = await FlashSaleService.update(req.params.id, req.body);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await FlashSaleService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await FlashSaleService.delete(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            await FlashSaleService.restore(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = FlashSaleController;
