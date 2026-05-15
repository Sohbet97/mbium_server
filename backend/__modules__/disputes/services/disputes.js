const db = require("../../../models");

const TERMINAL_STATUSES = ["RESOLVED", "CLOSED"];

const INCLUDES = [
    { model: db.Order, as: "order", attributes: ["id", "status", "total_price", "currency"], required: false },
    { model: db.User, as: "opener", attributes: ["id", "name", "surname"], required: false },
    { model: db.User, as: "resolver", attributes: ["id", "name", "surname"], required: false },
];

class DisputeService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.Dispute.findAll({
            where: filter,
            offset: skip,
            limit,
            paranoid,
            order: [["createdAt", "DESC"]],
            include: INCLUDES,
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Dispute.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.Dispute.findOne({ where: { id }, paranoid, include: INCLUDES });
    }

    static async create(body) {
        return db.Dispute.create(body);
    }

    static async updateStatus(id, status, resolution, userId) {
        const update = { status };
        if (resolution !== undefined) update.resolution = resolution;
        if (TERMINAL_STATUSES.includes(status)) {
            update.resolved_by = userId;
            update.resolved_at = new Date();
        }
        await db.Dispute.update(update, { where: { id } });
        return this.getById(id);
    }

    static async delete(id, force = false) {
        return db.Dispute.destroy({ where: { id }, force });
    }

    static async restore(id) {
        return db.Dispute.restore({ where: { id } });
    }

    static getFilter({ order_id, opened_by, status } = {}) {
        const filter = {};
        if (order_id !== undefined) filter.order_id = order_id;
        if (opened_by !== undefined) filter.opened_by = opened_by;
        if (status) filter.status = status;
        return filter;
    }
}

module.exports = DisputeService;
