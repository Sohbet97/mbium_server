const { Op } = require("sequelize");
const db = require("../../../models");

class BannerService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.Banner.findAll({
            where: filter,
            offset: skip,
            limit,
            paranoid,
            order: [["order", "ASC"], ["createdAt", "DESC"]],
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
            ],
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Banner.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.Banner.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
            ],
        });
    }

    static async create(body) {
        return db.Banner.create(body);
    }

    static async update(id, body) {
        await db.Banner.update(body, { where: { id } });
        return this.getById(id);
    }

    static async delete(id, force = false) {
        return db.Banner.destroy({ where: { id }, force });
    }

    static async restore(id) {
        return db.Banner.restore({ where: { id } });
    }

    static getFilter({ shop_id, placement, is_active } = {}) {
        const filter = {};
        if (shop_id !== undefined) filter.shop_id = shop_id === "null" ? null : shop_id;
        if (placement) filter.placement = placement;
        if (is_active !== undefined) filter.is_active = is_active === "true" || is_active === true;
        return filter;
    }
}

module.exports = BannerService;
