const { Op } = require("sequelize");
const crypto = require("crypto");
const db = require("../../../models");

class DiscountService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.Discount.findAll({
            where: filter,
            offset: skip,
            limit,
            paranoid,
            order: [["createdAt", "DESC"]],
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
            ],
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Discount.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.Discount.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
            ],
        });
    }

    static async getByCode(code) {
        return db.Discount.findOne({ where: { code, is_active: true } });
    }

    static async create(body) {
        const code = body.code?.trim().toUpperCase() || crypto.randomBytes(4).toString("hex").toUpperCase();
        return db.Discount.create({ ...body, code });
    }

    static async update(id, body) {
        if (body.code) body.code = body.code.trim().toUpperCase();
        await db.Discount.update(body, { where: { id } });
        return this.getById(id);
    }

    static async delete(id, force = false) {
        return db.Discount.destroy({ where: { id }, force });
    }

    static async restore(id) {
        return db.Discount.restore({ where: { id } });
    }

    static getFilter({ shop_id, is_active, code } = {}) {
        const filter = {};
        if (shop_id) filter.shop_id = shop_id;
        if (is_active !== undefined) filter.is_active = is_active === "true" || is_active === true;
        if (code) filter.code = { [Op.iLike]: `%${code}%` };
        return filter;
    }
}

module.exports = DiscountService;
