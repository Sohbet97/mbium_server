const { Op } = require("sequelize");
const ApiError = require("../../../exceptions/api-error");
const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const Validator = require("../../../__artefacts__/_validator_");
const ProductService = require("../services/products");
const productSchema = require("../validators/product.schema");

class ProductController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = this.getFilter(req.query);
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                ProductService.get(filter, limit, sort, skip, paranoid),
                ProductService.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const model = await ProductService.getById(req.params.id, paranoid);
            if (!model) throw ApiError.NotFound("Haryt tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(productSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await ProductService.create(req);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const model = await ProductService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Haryt tapylmady");
            const { isError, errors } = await Validator.validate(productSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            await ProductService.update(req.params.id, req);
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await ProductService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await ProductService.delete(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            const model = await db.Product.findOne({ where: { id: req.params.id }, paranoid: false });
            if (!model) throw ApiError.NotFound("Haryt tapylmady");
            if (model.deletedAt) await model.restore();
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    // ── Images ──────────────────────────────────────────────────────────────────

    static async addImage(req, res, next) {
        try {
            const { url, is_primary, order } = req.body;
            if (!url) throw ApiError.BadRequest("Surat URL talap edilýär");
            const image = await ProductService.addImage(req.params.id, url, is_primary, order);
            return res.status(201).json({ model: image });
        } catch (e) { next(e); }
    }

    static async deleteImage(req, res, next) {
        try {
            await ProductService.deleteImage(req.params.imageId);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    // ── Variants ─────────────────────────────────────────────────────────────────

    static async addVariant(req, res, next) {
        try {
            if (!req.body?.name) throw ApiError.BadRequest("Wariant adyny giriziň");
            const variant = await ProductService.addVariant(req.params.id, req.body);
            return res.status(201).json({ model: variant });
        } catch (e) { next(e); }
    }

    static async updateVariant(req, res, next) {
        try {
            await ProductService.updateVariant(req.params.variantId, req.body);
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async deleteVariant(req, res, next) {
        try {
            await ProductService.deleteVariant(req.params.variantId);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static getFilter({ text, category_id, shop_id, is_active, status, paranoid } = {}) {
        const filter = {};
        if (text) {
            filter[Op.or] = [
                { name: { [Op.iLike]: `%${text}%` } },
                { name_ru: { [Op.iLike]: `%${text}%` } },
                { sku: { [Op.iLike]: `%${text}%` } },
            ];
        }
        if (category_id) filter.category_id = category_id;
        if (shop_id) filter.shop_id = shop_id;
        if (is_active !== undefined) filter.is_active = is_active;
        if (status !== undefined) filter.status = status;
        if (paranoid) filter.deletedAt = { [Op.ne]: null };
        return filter;
    }
}

module.exports = ProductController;
