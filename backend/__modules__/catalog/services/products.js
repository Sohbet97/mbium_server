const { Op } = require("sequelize");
const db = require("../../../models");
const CATALOG_CONSTANTS = require("../utils/constants");

class ProductService {
    static async get(filter = {}, limit, sort = CATALOG_CONSTANTS.PRODUCT_SORT, skip = 0, paranoid = true) {
        return db.Product.findAll({
            where: filter,
            offset: skip,
            order: sort,
            limit,
            paranoid,
            include: [
                { model: db.Category, as: "category", attributes: ["id", "name"] },
                { model: db.Shop, as: "shop", attributes: ["id", "name"] },
                {
                    model: db.ProductMedia,
                    as: "productMedia",
                    where: { role: "primary" },
                    required: false,
                    include: [{ model: db.Media, as: "media", attributes: ["id", "url", "thumbnail_url"] }],
                },
            ],
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Product.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.Product.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.Category, as: "category", attributes: ["id", "name", "slug"] },
                { model: db.Shop, as: "shop", attributes: ["id", "name", "logo"] },
                { model: db.Brand, as: "brand", required: false },
                {
                    model: db.ProductVariant,
                    as: "variants",
                    include: [
                        { model: db.ProductVariantSize, as: "sizes", include: [{ model: db.Size, as: "size" }] },
                        {
                            model: db.ProductMedia,
                            as: "media",
                            required: false,
                            where: { role: { [Op.in]: ["primary", "gallery"] } },
                            order: [["sort_order", "ASC"]],
                            include: [{ model: db.Media, as: "media" }],
                        },
                    ],
                },
                {
                    model: db.ProductMedia,
                    as: "productMedia",
                    where: { variant_id: null },
                    required: false,
                    order: [["sort_order", "ASC"]],
                    include: [{ model: db.Media, as: "media" }],
                },
            ],
        });
    }

    static async create(req) {
        return db.Product.create({
            shop_id:                req.body?.shop_id,
            category_id:            req.body?.category_id,
            name:                   req.body?.name,
            name_ru:                req.body?.name_ru,
            name_eng:               req.body?.name_eng,
            description:            req.body?.description,
            price:                  req.body?.price ?? 0,
            compare_at_price:       req.body?.compare_at_price,
            currency:               req.body?.currency || "TMT",
            cost_price:             req.body?.cost_price,
            sku:                    req.body?.sku,
            barcode:                req.body?.barcode,
            weight:                 req.body?.weight,
            stock:                  req.body?.stock ?? 0,
            tags:                   req.body?.tags,
            handle:                 req.body?.handle,
            seo_title:              req.body?.seo_title,
            seo_description:        req.body?.seo_description,
            is_physical:            req.body?.is_physical ?? true,
            track_inventory:        req.body?.track_inventory ?? true,
            sell_when_out_of_stock: req.body?.sell_when_out_of_stock ?? false,
            status:                 req.body?.status ?? 1,
            brand_id:               req.body?.brand_id    ?? null,
            supplier_id:            req.body?.supplier_id ?? null,
            is_active:              req.body?.is_active ?? true,
            is_published:           req.body?.is_published ?? true,
            scheduled_at:           req.body?.scheduled_at ?? null,
            createdBy:              req.user?.id,
        });
    }

    static async update(id, req) {
        return db.Product.update(
            {
                category_id:            req.body?.category_id,
                name:                   req.body?.name,
                name_ru:                req.body?.name_ru,
                name_eng:               req.body?.name_eng,
                description:            req.body?.description,
                price:                  req.body?.price,
                compare_at_price:       req.body?.compare_at_price,
                currency:               req.body?.currency,
                cost_price:             req.body?.cost_price,
                sku:                    req.body?.sku,
                barcode:                req.body?.barcode,
                weight:                 req.body?.weight,
                stock:                  req.body?.stock,
                tags:                   req.body?.tags,
                handle:                 req.body?.handle,
                seo_title:              req.body?.seo_title,
                seo_description:        req.body?.seo_description,
                is_physical:            req.body?.is_physical,
                track_inventory:        req.body?.track_inventory,
                sell_when_out_of_stock: req.body?.sell_when_out_of_stock,
                brand_id:               req.body?.brand_id,
                supplier_id:            req.body?.supplier_id,
                status:                 req.body?.status,
                is_active:              req.body?.is_active,
                is_published:           req.body?.is_published,
                scheduled_at:           req.body?.scheduled_at,
            },
            { where: { id } }
        );
    }

    static async delete(id, force = false) {
        return db.Product.destroy({ where: { id }, force });
    }

    // ── Variants ─────────────────────────────────────────────────────────────────

    static async addVariant(productId, data) {
        return db.ProductVariant.create({ product_id: productId, ...data });
    }

    static async updateVariant(productId, variantId, data) {
        return db.ProductVariant.update(data, { where: { id: variantId, product_id: productId } });
    }

    static async deleteVariant(productId, variantId) {
        return db.ProductVariant.destroy({ where: { id: variantId, product_id: productId } });
    }

    // ── Variant sizes ────────────────────────────────────────────────────────────

    static async addVariantSize(variantId, data) {
        return db.ProductVariantSize.create({ variant_id: variantId, ...data });
    }

    static async updateVariantSize(variantId, sizeRowId, data) {
        return db.ProductVariantSize.update(data, { where: { id: sizeRowId, variant_id: variantId } });
    }

    static async deleteVariantSize(variantId, sizeRowId) {
        return db.ProductVariantSize.destroy({ where: { id: sizeRowId, variant_id: variantId } });
    }
}

module.exports = ProductService;
