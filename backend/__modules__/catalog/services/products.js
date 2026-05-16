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
                { model: db.ProductImage, as: "images", where: { is_primary: true }, required: false },
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
                { model: db.ProductVariant, as: "variants" },
                { model: db.ProductImage, as: "images", order: [["order", "ASC"]] },
            ],
        });
    }

    static async create(req) {
        return db.Product.create({
            shop_id: req.body?.shop_id,
            category_id: req.body?.category_id,
            name: req.body?.name,
            name_ru: req.body?.name_ru,
            name_eng: req.body?.name_eng,
            description: req.body?.description,
            price: req.body?.price,
            currency: req.body?.currency || "TMT",
            sku: req.body?.sku,
            stock: req.body?.stock ?? 0,
            status: req.body?.status ?? 1,
            is_active: req.body?.is_active ?? true,
            createdBy: req.user?.id,
        });
    }

    static async update(id, req) {
        return db.Product.update(
            {
                category_id:     req.body?.category_id,
                name:            req.body?.name,
                name_ru:         req.body?.name_ru,
                name_eng:        req.body?.name_eng,
                description:     req.body?.description,
                price:           req.body?.price,
                compare_at_price: req.body?.compare_at_price,
                currency:        req.body?.currency,
                sku:             req.body?.sku,
                barcode:         req.body?.barcode,
                weight:          req.body?.weight,
                stock:           req.body?.stock,
                tags:            req.body?.tags,
                handle:          req.body?.handle,
                seo_title:       req.body?.seo_title,
                seo_description: req.body?.seo_description,
                status:          req.body?.status,
                is_active:       req.body?.is_active,
            },
            { where: { id } }
        );
    }

    static async delete(id, force = false) {
        return db.Product.destroy({ where: { id }, force });
    }

    // ── Images ──────────────────────────────────────────────────────────────────

    static async addImage(productId, url, isPrimary = false, order = null) {
        if (isPrimary) {
            await db.ProductImage.update({ is_primary: false }, { where: { product_id: productId } });
        }
        return db.ProductImage.create({ product_id: productId, url, is_primary: isPrimary, order });
    }

    static async deleteImage(imageId) {
        return db.ProductImage.destroy({ where: { id: imageId } });
    }

    // ── Variants ─────────────────────────────────────────────────────────────────

    static async addVariant(productId, data) {
        return db.ProductVariant.create({ product_id: productId, ...data });
    }

    static async updateVariant(variantId, data) {
        return db.ProductVariant.update(data, { where: { id: variantId } });
    }

    static async deleteVariant(variantId) {
        return db.ProductVariant.destroy({ where: { id: variantId } });
    }
}

module.exports = ProductService;
