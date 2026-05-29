const db = require("../../../models");

const INCLUDES = [
    { model: db.Shop, as: "shop", attributes: ["id", "name"] },
];

class WarehouseService {
    static async get(filter = {}, limit, skip = 0) {
        return db.Warehouse.findAll({
            where: filter,
            offset: skip,
            limit,
            order: [["is_default", "DESC"], ["createdAt", "DESC"]],
            include: INCLUDES,
        });
    }

    static async getCount(filter = {}) {
        return db.Warehouse.count({ where: filter });
    }

    static async getById(id) {
        if (!id) return null;
        return db.Warehouse.findOne({
            where: { id },
            include: INCLUDES,
        });
    }

    static async create(data) {
        if (data.is_default) {
            await db.Warehouse.update({ is_default: false }, { where: { shop_id: data.shop_id } });
        }
        return db.Warehouse.create(data);
    }

    static async update(id, data) {
        const existing = await db.Warehouse.findOne({ where: { id } });
        if (!existing) return null;
        if (data.is_default) {
            await db.Warehouse.update({ is_default: false }, { where: { shop_id: existing.shop_id } });
        }
        await existing.update(data);
        return existing;
    }

    static async delete(id) {
        return db.Warehouse.destroy({ where: { id } });
    }

    static async getDefaultForShop(shopId) {
        return db.Warehouse.findOne({
            where: { shop_id: shopId, is_default: true, is_active: true },
        });
    }

    static getFilter({ shop_id, is_active } = {}) {
        const filter = {};
        if (shop_id) filter.shop_id = shop_id;
        if (is_active !== undefined) filter.is_active = is_active === "true" || is_active === true;
        return filter;
    }
}

module.exports = WarehouseService;
