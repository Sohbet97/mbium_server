const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");

class CartService {
    static async getByUser(userId) {
        return db.CartItem.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: db.Product,
                    as: "product",
                    attributes: ["id", "name", "price", "currency", "stock", "is_active"],
                    include: [{
                        model: db.ProductMedia,
                        as: "productMedia",
                        where: { role: "primary", variant_id: null },
                        required: false,
                        include: [{ model: db.Media, as: "media", attributes: ["id", "url", "thumbnail_url"] }],
                    }],
                },
                {
                    model: db.ProductVariant,
                    as: "variant",
                    attributes: ["id", "name", "price", "stock"],
                    required: false,
                    include: [{
                        model: db.ProductMedia,
                        as: "media",
                        where: { role: "primary" },
                        required: false,
                        include: [{ model: db.Media, as: "media", attributes: ["id", "url", "thumbnail_url"] }],
                    }],
                },
                {
                    model: db.ProductVariantSize,
                    as: "variantSize",
                    attributes: ["id", "sku", "price", "stock"],
                    required: false,
                    include: [{ model: db.Size, as: "size", attributes: ["id", "name"] }],
                },
            ],
        });
    }

    // Resolves what's actually being bought: ProductVariantSize (if the variant has sizes)
    // -> ProductVariant (if it doesn't) -> Product (no variants at all). Throws if the caller
    // didn't pick a required variant/size, picked one that doesn't belong to this product/variant,
    // or requested more than the effective stock allows.
    static async _resolveSelection(productId, variantId, variantSizeId) {
        const product = await db.Product.findOne({
            where: { id: productId },
            include: [{
                model: db.ProductVariant,
                as: "variants",
                where: { is_active: true },
                required: false,
                include: [{ model: db.ProductVariantSize, as: "sizes", where: { is_active: true }, required: false }],
            }],
        });
        if (!product || !product.is_active) throw ApiError.NotFound("Haryt tapylmady");

        const activeVariants = product.variants || [];
        let variant = null;
        let variantSize = null;

        if (activeVariants.length > 0) {
            if (!variantId) throw ApiError.BadRequest("Wariant saýlaň");
            variant = activeVariants.find((v) => v.id === Number(variantId));
            if (!variant) throw ApiError.BadRequest("Wariant tapylmady");

            const sizes = variant.sizes || [];
            if (sizes.length > 0) {
                if (!variantSizeId) throw ApiError.BadRequest("Ölçegi saýlaň");
                variantSize = sizes.find((s) => s.id === Number(variantSizeId));
                if (!variantSize) throw ApiError.BadRequest("Ölçeg tapylmady");
            }
        }

        const effectiveStock = variantSize ? variantSize.stock : variant ? variant.stock : product.stock;
        return { product, variant, variantSize, effectiveStock };
    }

    static async upsert(userId, productId, variantId = null, variantSizeId = null, quantity = 1) {
        const { product, variant, variantSize, effectiveStock } =
            await this._resolveSelection(productId, variantId, variantSizeId);

        if (!product.sell_when_out_of_stock && effectiveStock < quantity) {
            throw ApiError.BadRequest(`Ýeterlik stok ýok (bar: ${effectiveStock})`);
        }

        const where = {
            user_id: userId,
            product_id: productId,
            variant_id: variant?.id ?? null,
            variant_size_id: variantSize?.id ?? null,
        };
        const existing = await db.CartItem.findOne({ where });
        if (existing) {
            existing.quantity = quantity;
            return existing.save();
        }
        return db.CartItem.create({ ...where, quantity });
    }

    static async remove(userId, itemId) {
        return db.CartItem.destroy({ where: { id: itemId, user_id: userId } });
    }

    static async clear(userId) {
        return db.CartItem.destroy({ where: { user_id: userId } });
    }
}

module.exports = CartService;
