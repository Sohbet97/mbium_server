const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const Validator = require("../../../__artefacts__/_validator_");
const CollectionService = require("../services/collections");
const collectionSchema = require("../validators/collection.schema");

class CollectionController {
    static async get(req, res, next) {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const filter = {};
            if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === "true";
            const [data, count] = await Promise.all([
                CollectionService.get(filter, limit, skip),
                CollectionService.getCount(filter),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await CollectionService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Kolleksiýa tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(collectionSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await CollectionService.create(req.body);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const model = await CollectionService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Kolleksiýa tapylmady");
            const { isError, errors } = await Validator.validate(collectionSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            await CollectionService.update(req.params.id, req.body);
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await CollectionService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    // ── Products ────────────────────────────────────────────────────────────────

    static async addProduct(req, res, next) {
        try {
            const { product_id, sort_order } = req.body;
            if (!product_id) throw ApiError.BadRequest("product_id talap edilýär");
            const entry = await CollectionService.addProduct(req.params.id, product_id, sort_order ?? 0);
            return res.status(201).json({ model: entry });
        } catch (e) { next(e); }
    }

    static async removeProduct(req, res, next) {
        try {
            await CollectionService.removeProduct(req.params.id, req.params.productId);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async searchProducts(req, res, next) {
        try {
            const { q, collection_id } = req.query;
            const products = await CollectionService.searchProducts(q, collection_id);
            return res.status(200).json({ data: products });
        } catch (e) { next(e); }
    }
}

module.exports = CollectionController;
