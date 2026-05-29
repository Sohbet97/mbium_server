const { Op } = require("sequelize");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");

class SupplierService {

    static async getAll(filter = {}, limit, skip = 0) {
        return db.Supplier.findAndCountAll({
            where: filter,
            order: [["name", "ASC"]],
            limit,
            offset: skip,
            include: [
                { model: db.Country, as: "country", attributes: ["id", "name"], required: false },
            ],
        });
    }

    static async getById(id) {
        return db.Supplier.findOne({
            where: { id },
            include: [{ model: db.Country, as: "country", attributes: ["id", "name"], required: false }],
        });
    }

    static async create(data) {
        return db.Supplier.create(data);
    }

    static async update(id, data) {
        await db.Supplier.update(data, { where: { id } });
        return this.getById(id);
    }

    static async delete(id) {
        await db.Product.update({ supplier_id: null }, { where: { supplier_id: id } });
        return db.Supplier.destroy({ where: { id } });
    }

    static buildFilter({ text, is_active, country_id } = {}) {
        const filter = {};
        if (is_active !== undefined) filter.is_active = is_active === "true" || is_active === true;
        if (country_id) filter.country_id = country_id;
        if (text) {
            filter[Op.or] = [
                { name:         { [Op.iLike]: `%${text}%` } },
                { contact_name: { [Op.iLike]: `%${text}%` } },
                { email:        { [Op.iLike]: `%${text}%` } },
            ];
        }
        return filter;
    }
}

module.exports = SupplierService;
