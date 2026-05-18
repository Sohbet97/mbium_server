const { Op } = require("sequelize");
const db = require("../../../models");

class DeliverService {
    static async getAll(filter = {}, limit, offset = 0) {
        return db.Deliver.findAll({
            where: filter,
            offset,
            limit,
            order: [["createdAt", "DESC"]],
            include: [{ model: db.City, as: "city", attributes: ["id", "name"] }],
        });
    }

    static async getCount(filter = {}) {
        return db.Deliver.count({ where: filter });
    }

    static async getById(id) {
        if (!id) return null;
        return db.Deliver.findOne({
            where: { id },
            include: [{ model: db.City, as: "city", attributes: ["id", "name"] }],
        });
    }

    static async create(data) {
        return db.Deliver.create({
            first_name: data.first_name,
            last_name:  data.last_name,
            avatar:     data.avatar     ?? null,
            city_id:    data.city_id    ?? null,
            status:     data.status     ?? 0,
            phones:     data.phones     ?? [],
        });
    }

    static async update(id, data) {
        return db.Deliver.update(
            {
                first_name: data.first_name,
                last_name:  data.last_name,
                avatar:     data.avatar,
                city_id:    data.city_id,
                status:     data.status,
                phones:     data.phones,
            },
            { where: { id } }
        );
    }

    static async remove(id) {
        return db.Deliver.destroy({ where: { id } });
    }

    static async forceDelete(id) {
        return db.Deliver.destroy({ where: { id }, force: true });
    }

    static getFilter({ text, city_id, status } = {}) {
        const filter = {};
        if (text) {
            filter[Op.or] = [
                { first_name: { [Op.iLike]: `%${text}%` } },
                { last_name:  { [Op.iLike]: `%${text}%` } },
            ];
        }
        if (city_id !== undefined) filter.city_id = city_id;
        if (status  !== undefined) filter.status  = status;
        return filter;
    }
}

module.exports = DeliverService;
