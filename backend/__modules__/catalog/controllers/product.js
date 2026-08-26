const { Op, literal } = require("sequelize");
const { buildTsQuery } = require("../../../services/search");
const ApiError = require("../../../exceptions/api-error");
const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const Validator = require("../../../__artefacts__/_validator_");
const ProductService = require("../services/products");
const productSchema = require("../validators/product.schema");
const priceTierSchema = require("../validators/price-tier.schema");

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

            // Enforce plan product_limit
            const shop_id = req.body?.shop_id;
            if (shop_id) {
                const shop = await db.Shop.findOne({ where: { id: shop_id }, include: [{ model: db.Plan, as: "plan" }] });
                if (shop?.plan?.product_limit != null) {
                    const count = await db.Product.count({ where: { shop_id } });
                    if (count >= shop.plan.product_limit) {
                        throw ApiError.NotAllowed(`Siziň planynyz diňe ${shop.plan.product_limit} haryt goşmaga rugsat berýär. Planynyz täzeläň.`);
                    }
                }
            }

            // Products created directly by an admin/moderator don't need self-review
            if (req.body.moderation_status === undefined) req.body.moderation_status = 1;

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

    static async approve(req, res, next) {
        try {
            const existing = await ProductService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Haryt tapylmady");
            const model = await ProductService.approve(req.params.id, req.user?.id);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async reject(req, res, next) {
        try {
            const existing = await ProductService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Haryt tapylmady");
            const model = await ProductService.reject(req.params.id, req.user?.id, req.body?.note);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async bulkUpdate(req, res, next) {
        try {
            const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : [];
            if (!ids.length) throw ApiError.BadRequest("Harytlary saýlaň");

            const { is_active, status, moderation_status, moderation_note } = req.body || {};
            if (is_active === undefined && status === undefined && moderation_status === undefined) {
                throw ApiError.BadRequest("Üýtgetjek meýdany saýlaň");
            }

            const [count] = await ProductService.bulkUpdate(ids, {
                is_active,
                status,
                moderation_status,
                moderation_note,
                moderatedBy: req.user?.id,
            });
            return res.status(200).json({ ok: true, count });
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
            const [count] = await ProductService.updateVariant(req.params.id, req.params.variantId, req.body);
            if (!count) throw ApiError.NotFound("Wariant tapylmady");
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async deleteVariant(req, res, next) {
        try {
            const count = await ProductService.deleteVariant(req.params.id, req.params.variantId);
            if (!count) throw ApiError.NotFound("Wariant tapylmady");
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    // ── Variant sizes ─────────────────────────────────────────────────────────────

    static async addVariantSize(req, res, next) {
        try {
            const variant = await db.ProductVariant.findOne({ where: { id: req.params.variantId, product_id: req.params.id } });
            if (!variant) throw ApiError.NotFound("Wariant tapylmady");
            if (!req.body?.size_id) throw ApiError.BadRequest("Ölçegi saýlaň");
            const sizeRow = await ProductService.addVariantSize(req.params.variantId, req.body);
            return res.status(201).json({ model: sizeRow });
        } catch (e) { next(e); }
    }

    static async updateVariantSize(req, res, next) {
        try {
            const variant = await db.ProductVariant.findOne({ where: { id: req.params.variantId, product_id: req.params.id } });
            if (!variant) throw ApiError.NotFound("Wariant tapylmady");
            const [count] = await ProductService.updateVariantSize(req.params.variantId, req.params.sizeRowId, req.body);
            if (!count) throw ApiError.NotFound("Ölçeg tapylmady");
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async deleteVariantSize(req, res, next) {
        try {
            const variant = await db.ProductVariant.findOne({ where: { id: req.params.variantId, product_id: req.params.id } });
            if (!variant) throw ApiError.NotFound("Wariant tapylmady");
            const count = await ProductService.deleteVariantSize(req.params.variantId, req.params.sizeRowId);
            if (!count) throw ApiError.NotFound("Ölçeg tapylmady");
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    // ── Price tiers ──────────────────────────────────────────────────────────────

    static async addProductPriceTier(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(priceTierSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const tier = await ProductService.addProductPriceTier(req.params.id, req.body);
            return res.status(201).json({ model: tier });
        } catch (e) { next(e); }
    }

    static async updateProductPriceTier(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(priceTierSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const [count] = await ProductService.updateProductPriceTier(req.params.id, req.params.tierId, req.body);
            if (!count) throw ApiError.NotFound("Baha basgançagy tapylmady");
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async deleteProductPriceTier(req, res, next) {
        try {
            const count = await ProductService.deleteProductPriceTier(req.params.id, req.params.tierId);
            if (!count) throw ApiError.NotFound("Baha basgançagy tapylmady");
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async addVariantPriceTier(req, res, next) {
        try {
            const variant = await db.ProductVariant.findOne({ where: { id: req.params.variantId, product_id: req.params.id } });
            if (!variant) throw ApiError.NotFound("Wariant tapylmady");
            const { isError, errors } = await Validator.validate(priceTierSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const tier = await ProductService.addVariantPriceTier(req.params.variantId, req.body);
            return res.status(201).json({ model: tier });
        } catch (e) { next(e); }
    }

    static async updateVariantPriceTier(req, res, next) {
        try {
            const variant = await db.ProductVariant.findOne({ where: { id: req.params.variantId, product_id: req.params.id } });
            if (!variant) throw ApiError.NotFound("Wariant tapylmady");
            const { isError, errors } = await Validator.validate(priceTierSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const [count] = await ProductService.updateVariantPriceTier(req.params.variantId, req.params.tierId, req.body);
            if (!count) throw ApiError.NotFound("Baha basgançagy tapylmady");
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async deleteVariantPriceTier(req, res, next) {
        try {
            const variant = await db.ProductVariant.findOne({ where: { id: req.params.variantId, product_id: req.params.id } });
            if (!variant) throw ApiError.NotFound("Wariant tapylmady");
            const count = await ProductService.deleteVariantPriceTier(req.params.variantId, req.params.tierId);
            if (!count) throw ApiError.NotFound("Baha basgançagy tapylmady");
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    // `search` is accepted as an alias of `text` so a client using either name
    // filters instead of silently getting the unfiltered list
    static getFilter({ text, search, category_id, shop_id, brand_id, color_hex, is_active, status, moderation_status, paranoid } = {}) {
        const filter = {};
        const term = text ?? search;
        if (term) {
            const q = buildTsQuery(term)
            if (q) {
                filter[Op.and] = [literal(
                    `to_tsvector('simple',
                       COALESCE(name,'') || ' ' || COALESCE(name_ru,'') || ' ' ||
                       COALESCE(name_eng,'') || ' ' || COALESCE(sku,'') || ' ' ||
                       COALESCE(description,'')
                     ) @@ to_tsquery('simple', '${q.replace(/'/g, "''")}')`
                )]
            } else {
                filter[Op.or] = [
                    { name:    { [Op.iLike]: `%${term}%` } },
                    { name_ru: { [Op.iLike]: `%${term}%` } },
                    { sku:     { [Op.iLike]: `%${term}%` } },
                ]
            }
        }
        if (category_id) filter.category_id = category_id;
        if (shop_id) filter.shop_id = shop_id;
        if (brand_id) filter.brand_id = brand_id;
        // Appended to Op.and rather than assigned, so it survives alongside the
        // text search above (which may already own Op.and or Op.or)
        const color = ProductService.colorFilter(color_hex);
        if (color) filter[Op.and] = [...(filter[Op.and] ?? []), color];
        if (is_active !== undefined) filter.is_active = is_active;
        if (status !== undefined) filter.status = status;
        if (moderation_status !== undefined) filter.moderation_status = moderation_status;
        if (paranoid) filter.deletedAt = { [Op.ne]: null };
        return filter;
    }
}

module.exports = ProductController;
