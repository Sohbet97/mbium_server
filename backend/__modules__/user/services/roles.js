const db = require("../../..//models");
const { FUNCTIONS } = require("../../../utils/functions");
class RoleService {
    static async get(filter, limit, sort, skip) {
        const data = await db.Role.findAll({
            where: filter,
            offset: skip,
            order: [sort],
            limit: limit,
            attributes: { exclude: ['creteatedBy', 'updatedAt'] }
        });
        return data;
    }

    static async getForFilter() {
        const data = await db.Role.findAll({
            attributes: ['id', 'name'],
            order:[FUNCTIONS.getSort('order'), FUNCTIONS.getSort('name')]
        })
        return data;
    }

    static async getCount(filter) {
        const count = await db.Role.count({
            where: filter
        });
        return count;
    }

    static async getById(id) {
        const model = await db.Role.findOne({
            where: {
                id
            },
            attributes: { exclude: ['creteatedBy', 'updatedAt'] }
        });
        return model;
    }

    static async create(req) {
        const model = await db.Role.create({
            name: req.body?.name,
            permissions: req.body?.permissions,
            start_page: req.body?.start_page,
            modules: req.body?.modules,
            payment_class: FUNCTIONS.getNumber(req.body?.payment_class) || null,
            visit_limit: FUNCTIONS.getNumber(req.body?.visit_limit),
            lab_limit: FUNCTIONS.getNumber(req.body?.lab_limit),
            rad_limit: FUNCTIONS.getNumber(req.body?.rad_limit),
            spec_limit: FUNCTIONS.getNumber(req.body?.spec_limit),
            inst_limit: FUNCTIONS.getNumber(req.body?.inst_limit),
            treatment_limit: FUNCTIONS.getNumber(req.body?.treatment_limit),
            payment_limit: FUNCTIONS.getNumber(req.body?.payment_limit),
            payment_register_journal_limit: FUNCTIONS.getNumber(req.body?.payment_register_journal_limit),
            room_management_limit: FUNCTIONS.getNumber(req.body?.room_management_limit),
            document_management_limit: FUNCTIONS.getNumber(req.body?.document_management_limit),
            status: FUNCTIONS.getNumber(req.body?.status) || 0,
            order: FUNCTIONS.getNumber(req.body?.order) || null,
            createdBy: req.user?.id
        });
        return model;
    }

    static async delete(id) {
        await db.Role.destroy({ where: { id } })
    }
}
module.exports = RoleService