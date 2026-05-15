const { Op } = require("sequelize");
const db = require("../../../models");

class FlashSaleService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.FlashSale.findAll({
            where: filter,
            offset: skip,
            limit,
            paranoid,
            order: [["starts_at", "ASC"], ["createdAt", "DESC"]],
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
                { model: db.Product, as: "product", attributes: ["id", "name"], required: false },
                { model: db.ProductVariant, as: "variant", attributes: ["id", "name", "sku"], required: false },
            ],
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.FlashSale.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.FlashSale.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
                { model: db.Product, as: "product", attributes: ["id", "name"], required: false },
                { model: db.ProductVariant, as: "variant", attributes: ["id", "name", "sku"], required: false },
            ],
        });
    }

    static async create(body) {
        return db.FlashSale.create(body);
    }

    static async update(id, body) {
        await db.FlashSale.update(body, { where: { id } });
        return this.getById(id);
    }

    static async delete(id, force = false) {
        return db.FlashSale.destroy({ where: { id }, force });
    }

    static async restore(id) {
        return db.FlashSale.restore({ where: { id } });
    }

    static getFilter({ shop_id, product_id, is_active, active_now } = {}) {
        const filter = {};
        if (shop_id !== undefined) filter.shop_id = shop_id === "null" ? null : shop_id;
        if (product_id !== undefined) filter.product_id = product_id;
        if (is_active !== undefined) filter.is_active = is_active === "true" || is_active === true;
        if (active_now === "true" || active_now === true) {
            const now = new Date();
            filter.is_active = true;
            filter[Op.and] = [
                { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: now } }] },
                { [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gte]: now } }] },
            ];
        }
        return filter;
    }
}

module.exports = FlashSaleService;
