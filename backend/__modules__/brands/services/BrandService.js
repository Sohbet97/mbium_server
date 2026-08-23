const { Op } = require("sequelize");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");

function slugify(str) {
    return str.toLowerCase().trim().replace(/[^a-z0-9Ѐ-ӿ]+/g, "-").replace(/^-|-$/g, "");
}

class BrandService {

    static async getAll(filter = {}, limit, skip = 0) {
        return db.Brand.findAndCountAll({
            where: filter,
            order: [["sort_order", "ASC"], ["name", "ASC"]],
            limit,
            offset: skip,
            include: [{ model: db.Brand, as: "parent", attributes: ["id", "name"] }],
        });
    }

    static async getTree() {
        const all = await db.Brand.findAll({
            where: { is_active: true },
            order: [["sort_order", "ASC"], ["name", "ASC"]],
        });
        const map = {};
        all.forEach((b) => { map[b.id] = { ...b.toJSON(), children: [] }; });
        const roots = [];
        all.forEach((b) => {
            if (b.parent_id && map[b.parent_id]) {
                map[b.parent_id].children.push(map[b.id]);
            } else {
                roots.push(map[b.id]);
            }
        });
        return roots;
    }

    static async getById(id) {
        return db.Brand.findOne({ where: { id } });
    }

    static async create(data) {
        const slug = data.slug || slugify(data.name);
        return db.Brand.create({ ...data, slug });
    }

    static async update(id, data) {
        if (data.name && !data.slug) data.slug = slugify(data.name);
        await db.Brand.update(data, { where: { id } });
        return db.Brand.findOne({ where: { id } });
    }

    static async delete(id) {
        // Detach products first
        await db.Product.update({ brand_id: null }, { where: { brand_id: id } });
        return db.Brand.destroy({ where: { id } });
    }

    static buildFilter({ text, is_active, parent_id } = {}) {
        const filter = {};
        if (is_active !== undefined) filter.is_active = is_active === "true" || is_active === true;
        if (parent_id !== undefined) {
            // parent_id=null / "root" narrows to top-level brands only
            filter.parent_id = (parent_id === "null" || parent_id === "root" || parent_id === null)
                ? { [Op.is]: null }
                : parent_id;
        }
        if (text) {
            filter[Op.or] = [
                { name:    { [Op.iLike]: `%${text}%` } },
                { name_ru: { [Op.iLike]: `%${text}%` } },
                { name_en: { [Op.iLike]: `%${text}%` } },
                { slug:    { [Op.iLike]: `%${text}%` } },
            ];
        }
        return filter;
    }
}

module.exports = BrandService;
