const db = require("../../../models");

class DeliveryTypeService {

    static async getAll(filter = {}, limit, skip = 0) {
        return db.DeliveryType.findAndCountAll({
            where: filter,
            order: [["sort_order", "ASC"], ["name", "ASC"]],
            limit,
            offset: skip,
        });
    }

    static async getById(id) {
        return db.DeliveryType.findOne({ where: { id } });
    }

    static async create(data) {
        return db.DeliveryType.create(data);
    }

    static async update(id, data) {
        await db.DeliveryType.update(data, { where: { id } });
        return db.DeliveryType.findOne({ where: { id } });
    }

    static async delete(id) {
        await db.ProductDeliveryType.destroy({ where: { delivery_type_id: id } });
        return db.DeliveryType.destroy({ where: { id } });
    }
}

module.exports = DeliveryTypeService;
