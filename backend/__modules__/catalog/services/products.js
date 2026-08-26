const { Op } = require("sequelize");
const db = require("../../../models");
const CATALOG_CONSTANTS = require("../utils/constants");
const ColorService = require("../../colors/services/ColorService");
const ApiError = require("../../../exceptions/api-error");

class ProductService {

    /**
     * Normalise an incoming `color_hex` and check it against the palette.
     * Returns undefined when the field was absent (so it isn't overwritten on
     * update), null when explicitly cleared, otherwise a lower-case #rrggbb.
     * Validating here turns an unknown colour into a 400 instead of an FK error.
     */
    static async resolveColorHex(value) {
        if (value === undefined) return undefined;
        if (value === null || value === "") return null;

        const hex = ColorService.normalizeHex(value);
        if (!hex) throw ApiError.BadRequest("color_hex #rrggbb görnüşinde bolmaly");

        const exists = await db.Color.count({ where: { hex } });
        if (!exists) throw ApiError.BadRequest("Beýle reňk ýok");
        return hex;
    }
    // Widens a `db.Shop` include with the plan association needed for the
    // blue-check badge, then stamps the computed flag onto each result.
    static _shopInclude(attributes) {
        return {
            model: db.Shop,
            as: "shop",
            attributes: [...attributes, "is_verified"],
            include: db.Plan ? [{ model: db.Plan, as: "plan", attributes: ["verified_badge"], required: false }] : [],
        };
    }

    static _withShopBlueBadge(product) {
        if (product?.shop) {
            product.shop.setDataValue("has_blue_badge", Boolean(product.shop.plan?.verified_badge || product.shop.is_verified));
        }
        return product;
    }

    static async get(filter = {}, limit, sort = CATALOG_CONSTANTS.PRODUCT_SORT, skip = 0, paranoid = true) {
        const products = await db.Product.findAll({
            where: filter,
            offset: skip,
            order: sort,
            limit,
            paranoid,
            include: [
                { model: db.Category, as: "category", attributes: ["id", "name"] },
                this._shopInclude(["id", "name"]),
                { model: db.DeliveryType, as: "deliveryTypes", required: false, through: { attributes: [] } },
                { model: db.Color, as: "color", required: false, attributes: ["id", "name", "hex"] },
                // Attribute-limited on purpose — list views only need each variant's
                // colour; full variants come from getById().
                {
                    model: db.ProductVariant,
                    as: "variants",
                    required: false,
                    attributes: ["id", "name", "color_hex", "attributes"],
                },
                {
                    model: db.ProductMedia,
                    as: "productMedia",
                    where: { role: "primary" },
                    required: false,
                    include: [{ model: db.Media, as: "media", attributes: ["id", "url", "thumbnail_url"] }],
                },
                {
                    model: db.ProductMedia,
                    as: "models3d",
                    where: { variant_id: null, role: "3d" },
                    required: false,
                    include: [{ model: db.Media, as: "media", attributes: ["id", "url"] }],
                },
            ],
        });
        return products.map((product) => this._withShopBlueBadge(product));
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Product.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        const product = await db.Product.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.Category, as: "category", attributes: ["id", "name", "slug"] },
                this._shopInclude(["id", "name", "logo"]),
                { model: db.Brand, as: "brand", required: false },
                { model: db.Color, as: "color", required: false, attributes: ["id", "name", "hex"] },
                { model: db.DeliveryType, as: "deliveryTypes", required: false, through: { attributes: [] } },
                { model: db.ProductPriceTier, as: "priceTiers", required: false, order: [["min_qty", "ASC"]] },
                {
                    model: db.ProductVariant,
                    as: "variants",
                    include: [
                        { model: db.Color, as: "color", required: false, attributes: ["id", "name", "hex"] },
                        { model: db.ProductVariantSize, as: "sizes", include: [{ model: db.Size, as: "size" }] },
                        { model: db.ProductPriceTier, as: "priceTiers", required: false, order: [["min_qty", "ASC"]] },
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
                    where: { variant_id: null, role: { [Op.ne]: "3d" } },
                    required: false,
                    order: [["sort_order", "ASC"]],
                    include: [{ model: db.Media, as: "media" }],
                },
                {
                    model: db.ProductMedia,
                    as: "models3d",
                    where: { variant_id: null, role: "3d" },
                    required: false,
                    order: [["sort_order", "ASC"]],
                    include: [{ model: db.Media, as: "media" }],
                },
            ],
        });
        return this._withShopBlueBadge(product);
    }

    static async create(req) {
        const color_hex = await this.resolveColorHex(req.body?.color_hex);
        const product = await db.Product.create({
            color_hex:              color_hex ?? null,
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
            moderation_status:      req.body?.moderation_status ?? 0,
            createdBy:              req.user?.id,
        });
        if (Array.isArray(req.body?.delivery_type_ids)) {
            await product.setDeliveryTypes(req.body.delivery_type_ids);
        }
        return product;
    }

    static async update(id, req) {
        const color_hex = await this.resolveColorHex(req.body?.color_hex);
        const result = await db.Product.update(
            {
                ...(color_hex !== undefined ? { color_hex } : {}),
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
        if (Array.isArray(req.body?.delivery_type_ids)) {
            const product = await db.Product.findByPk(id);
            if (product) await product.setDeliveryTypes(req.body.delivery_type_ids);
        }
        return result;
    }

    static async delete(id, force = false) {
        return db.Product.destroy({ where: { id }, force });
    }

    /**
     * A where-fragment matching products of the given colour(s), counting both
     * the product's own colour and any of its variants'. Returns null when no
     * valid hex was supplied, so callers can skip it.
     *
     * The variant side is a literal subquery rather than an include, because an
     * include would filter the returned variants too (a red-filtered product
     * would come back showing only its red variant) and interferes with LIMIT.
     * Hexes are validated by parseHexList before interpolation.
     */
    static colorFilter(value) {
        const hexes = ColorService.parseHexList(value);
        if (!hexes.length) return null;

        const list = hexes.map((h) => `'${h}'`).join(", ");
        return {
            [Op.or]: [
                { color_hex: { [Op.in]: hexes } },
                {
                    id: {
                        [Op.in]: db.sequelize.literal(
                            `(SELECT product_id FROM product_variants
                              WHERE color_hex IN (${list}) AND "deletedAt" IS NULL)`
                        ),
                    },
                },
            ],
        };
    }

    // ── Moderation ───────────────────────────────────────────────────────────────

    static async approve(id, userId) {
        await db.Product.update(
            {
                moderation_status: 1,
                moderated_by: userId,
                moderated_at: new Date(),
                moderation_note: null,
            },
            { where: { id } }
        );
        return this.getById(id);
    }

    static async reject(id, userId, note) {
        await db.Product.update(
            {
                moderation_status: 2,
                moderated_by: userId,
                moderated_at: new Date(),
                moderation_note: note || null,
            },
            { where: { id } }
        );
        return this.getById(id);
    }

    static async bulkUpdate(ids, { is_active, status, moderation_status, moderation_note, moderatedBy } = {}) {
        const payload = {};
        if (is_active !== undefined) payload.is_active = is_active;
        if (status !== undefined) payload.status = status;
        if (moderation_status !== undefined) {
            payload.moderation_status = moderation_status;
            payload.moderated_by = moderatedBy;
            payload.moderated_at = new Date();
            payload.moderation_note = moderation_status === 2 ? (moderation_note || null) : null;
        }
        if (!Object.keys(payload).length) return [0];
        return db.Product.update(payload, { where: { id: { [Op.in]: ids } } });
    }

    // ── Variants ─────────────────────────────────────────────────────────────────

    static async addVariant(productId, data) {
        const color_hex = await this.resolveColorHex(data?.color_hex);
        return db.ProductVariant.create({ product_id: productId, ...data, color_hex: color_hex ?? null });
    }

    static async updateVariant(productId, variantId, data) {
        const color_hex = await this.resolveColorHex(data?.color_hex);
        const patch = { ...data, ...(color_hex !== undefined ? { color_hex } : {}) };
        return db.ProductVariant.update(patch, { where: { id: variantId, product_id: productId } });
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

    // ── Price tiers ──────────────────────────────────────────────────────────────

    // Rejects an invalid range (max_qty <= min_qty) or one that overlaps a sibling
    // tier belonging to the same owner (excludeId skips the tier being updated).
    static _assertNoTierOverlap({ min_qty, max_qty }, existingTiers, excludeId = null) {
        if (max_qty != null && max_qty <= min_qty) {
            throw ApiError.BadRequest("max_qty min_qty-den uly bolmaly");
        }
        const candidateMax = max_qty ?? Infinity;
        for (const tier of existingTiers) {
            if (excludeId != null && tier.id === excludeId) continue;
            const tierMax = tier.max_qty ?? Infinity;
            const overlaps = min_qty <= tierMax && candidateMax >= tier.min_qty;
            if (overlaps) {
                throw ApiError.BadRequest(`Bahalar araligy gabat gelýär (${tier.min_qty}-${tier.max_qty ?? "+"})`);
            }
        }
    }

    static async addProductPriceTier(productId, data) {
        const existing = await db.ProductPriceTier.findAll({ where: { product_id: productId } });
        this._assertNoTierOverlap(data, existing);
        return db.ProductPriceTier.create({ product_id: productId, min_qty: data.min_qty, max_qty: data.max_qty ?? null, unit_price: data.unit_price });
    }

    static async updateProductPriceTier(productId, tierId, data) {
        const existing = await db.ProductPriceTier.findAll({ where: { product_id: productId } });
        this._assertNoTierOverlap(data, existing, Number(tierId));
        return db.ProductPriceTier.update(
            { min_qty: data.min_qty, max_qty: data.max_qty ?? null, unit_price: data.unit_price },
            { where: { id: tierId, product_id: productId } }
        );
    }

    static async deleteProductPriceTier(productId, tierId) {
        return db.ProductPriceTier.destroy({ where: { id: tierId, product_id: productId } });
    }

    static async addVariantPriceTier(variantId, data) {
        const existing = await db.ProductPriceTier.findAll({ where: { variant_id: variantId } });
        this._assertNoTierOverlap(data, existing);
        return db.ProductPriceTier.create({ variant_id: variantId, min_qty: data.min_qty, max_qty: data.max_qty ?? null, unit_price: data.unit_price });
    }

    static async updateVariantPriceTier(variantId, tierId, data) {
        const existing = await db.ProductPriceTier.findAll({ where: { variant_id: variantId } });
        this._assertNoTierOverlap(data, existing, Number(tierId));
        return db.ProductPriceTier.update(
            { min_qty: data.min_qty, max_qty: data.max_qty ?? null, unit_price: data.unit_price },
            { where: { id: tierId, variant_id: variantId } }
        );
    }

    static async deleteVariantPriceTier(variantId, tierId) {
        return db.ProductPriceTier.destroy({ where: { id: tierId, variant_id: variantId } });
    }

    // Whether a purchase may go through with insufficient stock. The product-level
    // flag is a blanket allow for all of its variants; a variant can additionally
    // opt itself in. Sizes have no flag of their own — they follow their variant.
    static canSellOutOfStock(product, variant = null) {
        return !!(product?.sell_when_out_of_stock || variant?.sell_when_out_of_stock);
    }

    // Resolves the effective per-unit price for a purchase: a selected size's flat
    // price always wins (sizes aren't tiered); otherwise the variant's tiers are
    // checked by quantity, falling back to its flat price, then the product's tiers,
    // then the product's flat price. Never throws — bad/missing tier data must not
    // block a purchase.
    static resolveUnitPrice({ product, variant, variantSize, quantity }) {
        if (variantSize?.price != null) return parseFloat(variantSize.price);

        const findTier = (tiers) => (tiers || []).find(
            (t) => quantity >= t.min_qty && (t.max_qty == null || quantity <= t.max_qty)
        );

        if (variant) {
            const tier = findTier(variant.priceTiers);
            if (tier) return parseFloat(tier.unit_price);
            if (variant.price != null) return parseFloat(variant.price);
        }

        const tier = findTier(product.priceTiers);
        return parseFloat(tier ? tier.unit_price : product.price);
    }
}

module.exports = ProductService;
