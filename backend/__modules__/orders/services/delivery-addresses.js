const db = require("../../../models");

const INCLUDES = [
    { model: db.Region, as: "region", attributes: ["id", "name"], required: false },
    { model: db.City, as: "city", attributes: ["id", "name"], required: false },
    { model: db.District, as: "district", attributes: ["id", "name"], required: false },
];

class DeliveryAddressService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.DeliveryAddress.findAll({
            where: filter,
            offset: skip,
            limit,
            paranoid,
            order: [["is_default", "DESC"], ["createdAt", "DESC"]],
            include: INCLUDES,
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.DeliveryAddress.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.DeliveryAddress.findOne({ where: { id }, paranoid, include: INCLUDES });
    }

    static async create(body) {
        if (body.is_default) {
            await db.DeliveryAddress.update(
                { is_default: false },
                { where: { user_id: body.user_id } }
            );
        }
        return db.DeliveryAddress.create(body);
    }

    static async update(id, body) {
        if (body.is_default) {
            const existing = await db.DeliveryAddress.findOne({ where: { id } });
            if (existing) {
                await db.DeliveryAddress.update(
                    { is_default: false },
                    { where: { user_id: existing.user_id } }
                );
            }
        }
        await db.DeliveryAddress.update(body, { where: { id } });
        return this.getById(id);
    }

    static async delete(id, force = false) {
        return db.DeliveryAddress.destroy({ where: { id }, force });
    }

    static async restore(id) {
        return db.DeliveryAddress.restore({ where: { id } });
    }

    static getFilter({ user_id, region_id, city_id } = {}) {
        const filter = {};
        if (user_id) filter.user_id = user_id;
        if (region_id) filter.region_id = region_id;
        if (city_id) filter.city_id = city_id;
        return filter;
    }
}

module.exports = DeliveryAddressService;
