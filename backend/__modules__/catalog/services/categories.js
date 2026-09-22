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

    // Returns [categoryId, ...all descendant ids] at any nesting depth, via a
    // recursive CTE over the adjacency-list (parent_id) tree.
    static async getDescendantIds(categoryId) {
        const rows = await db.sequelize.query(
            `WITH RECURSIVE descendants AS (
                SELECT id FROM categories WHERE id = :categoryId
                UNION ALL
                SELECT c.id FROM categories c
                INNER JOIN descendants d ON c.parent_id = d.id
            )
            SELECT id FROM descendants`,
            { replacements: { categoryId }, type: db.Sequelize.QueryTypes.SELECT }
        );
        return rows.map((r) => r.id);
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
        const categories = await db.Category.findAll({
            where: { status: STATUSE_ACTIVE },
            order: CATALOG_CONSTANTS.CATEGORY_SORT,
        });

        const byId = new Map(categories.map((c) => [c.id, { ...c.toJSON(), children: [] }]));
        const roots = [];

        for (const category of byId.values()) {
            if (category.parent_id && byId.has(category.parent_id)) {
                byId.get(category.parent_id).children.push(category);
            } else {
                roots.push(category);
            }
        }

        return roots;
    }

    static async create(req) {
        return db.Category.create({
            parent_id: req.body?.parent_id || null,
            name: req.body?.name,
            name_ru: req.body?.name_ru,
            name_eng: req.body?.name_eng,
            slug: req.body?.slug,
            icon: req.body?.icon,
            image: req.body?.image,
            order: req.body?.order ?? null,
            status: req.body?.status ?? 0,
            createdBy: req.user?.id,
        });
    }

    // Walks up from candidateParentId toward the root; true if it ever reaches id (i.e. id is an ancestor of the candidate, which would create a cycle)
    static async wouldCreateCycle(id, candidateParentId) {
        if (!candidateParentId) return false;
        if (Number(candidateParentId) === Number(id)) return true;
        const seen = new Set();
        let current = await db.Category.findOne({ where: { id: candidateParentId }, paranoid: false });
        while (current?.parent_id) {
            if (Number(current.parent_id) === Number(id)) return true;
            if (seen.has(current.parent_id)) return false; // pre-existing cycle unrelated to this change
            seen.add(current.parent_id);
            current = await db.Category.findOne({ where: { id: current.parent_id }, paranoid: false });
        }
        return false;
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
                image: req.body?.image,
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
