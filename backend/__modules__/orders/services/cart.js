const { Op } = require("sequelize");
const db = require("../../../models");

class CartService {
    static async getByUser(userId) {
        return db.CartItem.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: db.Product,
                    as: "product",
                    attributes: ["id", "name", "price", "currency", "stock", "is_active"],
                    include: [{ model: db.ProductImage, as: "images", where: { is_primary: true }, required: false }],
                },
                {
                    model: db.ProductVariant,
                    as: "variant",
                    attributes: ["id", "name", "price", "stock"],
                    required: false,
                },
            ],
        });
    }

    static async upsert(userId, productId, variantId = null, quantity = 1) {
        const existing = await db.CartItem.findOne({
            where: { user_id: userId, product_id: productId, variant_id: variantId ?? null },
        });
        if (existing) {
            existing.quantity = quantity;
            return existing.save();
        }
        return db.CartItem.create({ user_id: userId, product_id: productId, variant_id: variantId, quantity });
    }

    static async remove(userId, itemId) {
        return db.CartItem.destroy({ where: { id: itemId, user_id: userId } });
    }

    static async clear(userId) {
        return db.CartItem.destroy({ where: { user_id: userId } });
    }
}

module.exports = CartService;
