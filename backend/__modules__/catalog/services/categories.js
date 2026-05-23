const { Op } = require("sequelize");
const db = require("../../../models");
const CATALOG_CONSTANTS = require("../utils/constants");
const { STATUSE_ACTIVE } = require("../../../utils/statuses");

class CategoryService {
    static async get(filter = {}, limit, sort = CATALOG_CONSTANTS.CATEGORY_SORT, skip = 0, paranoid = true) {
        return db.Category.findAll({
            where: filter,
            offset: skip,
            order: sort,
            limit,
            paranoid,
            include: [
                { model: db.Category, as: "parent", attributes: ["id", "name"] },
            ],
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Category.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.Category.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.Category, as: "parent", attributes: ["id", "name"] },
                { model: db.Category, as: "children", attributes: ["id", "name", "slug", "order", "status"] },
            ],
        });
    }

    static async getTree() {
        return db.Category.findAll({
            where: { parent_id: null, status: STATUSE_ACTIVE },
            order: CATALOG_CONSTANTS.CATEGORY_SORT,
            include: [
                {
                    model: db.Category,
                    as: "children",
                    where: { status: STATUSE_ACTIVE },
                    required: false,
                    order: CATALOG_CONSTANTS.CATEGORY_SORT,
                },
            ],
        });
    }

    static async create(req) {
        return db.Category.create({
            parent_id: req.body?.parent_id || null,
            name: req.body?.name,
            name_ru: req.body?.name_ru,
            name_eng: req.body?.name_eng,
            slug: req.body?.slug,
            icon: req.body?.icon,
            order: req.body?.order ?? null,
            status: req.body?.status ?? 1,
            createdBy: req.user?.id,
        });
    }

    static async update(id, req) {
        return db.Category.update(
            {
                parent_id: req.body?.parent_id || null,
                name: req.body?.name,
                name_ru: req.body?.name_ru,
                name_eng: req.body?.name_eng,
                slug: req.body?.slug,
                icon: req.body?.icon,
                order: req.body?.order ?? null,
                status: req.body?.status,
            },
            { where: { id } }
        );
    }

    static async delete(id, force = false) {
        return db.Category.destroy({ where: { id }, force });
    }
}

module.exports = CategoryService;
