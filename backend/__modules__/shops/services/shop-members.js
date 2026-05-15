const { Op } = require("sequelize");
const db = require("../../../models");

class ShopMemberService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.ShopMember.findAll({
            where: filter,
            offset: skip,
            limit,
            paranoid,
            order: [["createdAt", "DESC"]],
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
                { model: db.User, as: "user", attributes: ["id", "name", "surname"], required: false },
                { model: db.User, as: "inviter", attributes: ["id", "name", "surname"], required: false },
            ],
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.ShopMember.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.ShopMember.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
                { model: db.User, as: "user", attributes: ["id", "name", "surname"], required: false },
                { model: db.User, as: "inviter", attributes: ["id", "name", "surname"], required: false },
            ],
        });
    }

    static async getByShopAndUser(shop_id, user_id) {
        return db.ShopMember.findOne({ where: { shop_id, user_id } });
    }

    static async create(body) {
        return db.ShopMember.create(body);
    }

    static async update(id, body) {
        await db.ShopMember.update(body, { where: { id } });
        return this.getById(id);
    }

    static async delete(id, force = false) {
        return db.ShopMember.destroy({ where: { id }, force });
    }

    static async restore(id) {
        return db.ShopMember.restore({ where: { id } });
    }

    static getFilter({ shop_id, user_id, role, is_active } = {}) {
        const filter = {};
        if (shop_id) filter.shop_id = shop_id;
        if (user_id) filter.user_id = user_id;
        if (role) filter.role = role;
        if (is_active !== undefined) filter.is_active = is_active === "true" || is_active === true;
        return filter;
    }
}

module.exports = ShopMemberService;
