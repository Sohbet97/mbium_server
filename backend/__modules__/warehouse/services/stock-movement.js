const db = require("../../../models");

class StockMovementService {
    static async get(filter = {}, limit, skip = 0) {
        return db.StockMovement.findAll({
            where: filter,
            offset: skip,
            limit,
            order: [["createdAt", "DESC"]],
            include: [
                { model: db.Product, as: "product", attributes: ["id", "name"] },
                { model: db.ProductVariant, as: "variant", attributes: ["id", "name"], required: false },
                { model: db.Warehouse, as: "warehouse", attributes: ["id", "name"] },
            ],
        });
    }

    static async getCount(filter = {}) {
        return db.StockMovement.count({ where: filter });
    }

    static getFilter({ warehouse_id, product_id, order_id, type } = {}) {
        const filter = {};
        if (warehouse_id) filter.warehouse_id = warehouse_id;
        if (product_id) filter.product_id = product_id;
        if (order_id) filter.order_id = order_id;
        if (type) filter.type = type;
        return filter;
    }
}

module.exports = StockMovementService;
