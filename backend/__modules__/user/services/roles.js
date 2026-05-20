const db = require("../../..//models");
const { FUNCTIONS } = require("../../../utils/functions");
const ApiError = require("../../../exceptions/api-error");

class RoleService {
    static async get(filter, limit, sort, skip) {
        const data = await db.Role.findAll({
            where: filter,
            offset: skip,
            order: [sort],
            limit: limit,
            attributes: { exclude: ['createdBy', 'updatedAt'] }
        });
        return data;
    }

    static async getForFilter() {
        const data = await db.Role.findAll({
            attributes: ['id', 'name', 'slug'],
            order: [FUNCTIONS.getSort('order'), FUNCTIONS.getSort('name')]
        });
        return data;
    }

    static async getCount(filter) {
        const count = await db.Role.count({ where: filter });
        return count;
    }

    static async getById(id) {
        const model = await db.Role.findOne({
            where: { id },
            attributes: { exclude: ['createdBy', 'updatedAt'] }
        });
        return model;
    }

    static async getBySlug(slug) {
        return db.Role.findOne({ where: { slug } });
    }

    static async create(req) {
        const model = await db.Role.create({
            name:        req.body?.name,
            slug:        req.body?.slug || null,
            permissions: req.body?.permissions || [],
            modules:     req.body?.modules || [],
            start_page:  req.body?.start_page ?? 0,
            is_system:   false,
            status:      FUNCTIONS.getNumber(req.body?.status) ?? 0,
            order:       FUNCTIONS.getNumber(req.body?.order) || null,
            createdBy:   req.user?.id,
        });
        return model;
    }

    static async update(id, body) {
        const role = await db.Role.findOne({ where: { id } });
        if (!role) throw ApiError.NotFound();
        if (role.is_system) throw ApiError.NotAllowed('System roles cannot be modified');

        role.name        = body.name        ?? role.name;
        role.permissions = body.permissions ?? role.permissions;
        role.modules     = body.modules     ?? role.modules;
        role.start_page  = body.start_page  ?? role.start_page;
        role.order       = FUNCTIONS.getNumber(body.order) || null;
        role.status      = FUNCTIONS.getNumber(body.status) ?? role.status;
        await role.save();
        return role;
    }

    static async delete(id) {
        const role = await db.Role.findOne({ where: { id } });
        if (!role) throw ApiError.NotFound();
        if (role.is_system) throw ApiError.NotAllowed('System roles cannot be deleted');
        await db.Role.destroy({ where: { id } });
    }
}

module.exports = RoleService;
