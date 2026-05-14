const { Op } = require("sequelize");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");

class ReviewService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.Review.findAll({
            where: filter,
            offset: skip,
            order: [["createdAt", "DESC"]],
            limit,
            paranoid,
            include: [
                { model: db.User, as: "author", attributes: ["id", "name", "surname"] },
                { model: db.Product, as: "product", attributes: ["id", "name"] },
            ],
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Review.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.Review.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.User, as: "author", attributes: ["id", "name", "surname"] },
                { model: db.Product, as: "product", attributes: ["id", "name"] },
            ],
        });
    }

    static async create(userId, body) {
        const { product_id, order_id, rating, comment } = body;
        const existing = await db.Review.findOne({ where: { user_id: userId, product_id, order_id: order_id || null } });
        if (existing) throw ApiError.BadRequest("Bu haryt üçin siz eýýäm baha berdiňiz");

        const review = await db.Review.create({ user_id: userId, product_id, order_id, rating, comment, status: 1 });

        // Update product rating aggregate
        const stats = await db.Review.findOne({
            where: { product_id, status: 1 },
            attributes: [
                [db.sequelize.fn("AVG", db.sequelize.col("rating")), "avg_rating"],
                [db.sequelize.fn("COUNT", db.sequelize.col("id")), "total"],
            ],
            raw: true,
        });
        await db.Product.update(
            { rating: parseFloat(stats.avg_rating).toFixed(2), review_count: stats.total },
            { where: { id: product_id } }
        );

        return review;
    }

    static async updateStatus(id, status) {
        return db.Review.update({ status }, { where: { id } });
    }

    static async delete(id, force = false) {
        return db.Review.destroy({ where: { id }, force });
    }
}

module.exports = ReviewService;
