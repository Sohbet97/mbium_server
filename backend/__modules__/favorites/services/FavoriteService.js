const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");

class FavoriteService {

    static async getFavorites(userId, limit = 20, skip = 0) {
        return db.Favorite.findAndCountAll({
            where: { user_id: userId },
            order: [["createdAt", "DESC"]],
            limit,
            offset: skip,
            include: [{
                model: db.Product,
                as: "product",
                attributes: ["id", "name", "name_ru", "price", "currency", "rating", "is_active"],
                include: [{
                    model: db.ProductMedia,
                    as: "productMedia",
                    where: { role: "primary", variant_id: null },
                    required: false,
                    include: [{ model: db.Media, as: "media", attributes: ["id", "url", "thumbnail_url"] }],
                }],
            }],
        });
    }

    static async add(userId, productId) {
        const product = await db.Product.findOne({ where: { id: productId, is_active: true } });
        if (!product) throw ApiError.NotFound("Product not found");

        const [fav, created] = await db.Favorite.findOrCreate({
            where: { user_id: userId, product_id: productId },
            defaults: { user_id: userId, product_id: productId },
        });
        return { favorite: fav, created };
    }

    static async remove(userId, productId) {
        const deleted = await db.Favorite.destroy({ where: { user_id: userId, product_id: productId } });
        if (!deleted) throw ApiError.NotFound("Favorite not found");
        return { success: true };
    }

    static async isFavorited(userId, productId) {
        if (!userId) return false;
        const fav = await db.Favorite.findOne({ where: { user_id: userId, product_id: productId } });
        return !!fav;
    }
}

module.exports = FavoriteService;
