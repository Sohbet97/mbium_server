const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");

function slugify(str) {
    return str.toLowerCase().trim().replace(/[^a-z0-9Ѐ-ӿ]+/g, "-").replace(/^-|-$/g, "");
}

class SizeService {

    static async getAll(filter = {}, limit, skip = 0) {
        return db.Size.findAndCountAll({
            where: filter,
            order: [["sort_order", "ASC"], ["name", "ASC"]],
            limit,
            offset: skip,
            include: [{ model: db.Size, as: "parent", attributes: ["id", "name"] }],
        });
    }

    static async getTree() {
        const all = await db.Size.findAll({
            where: { is_active: true },
            order: [["sort_order", "ASC"], ["name", "ASC"]],
        });
        const map = {};
        all.forEach((s) => { map[s.id] = { ...s.toJSON(), children: [] }; });
        const roots = [];
        all.forEach((s) => {
            if (s.parent_id && map[s.parent_id]) {
                map[s.parent_id].children.push(map[s.id]);
            } else {
                roots.push(map[s.id]);
            }
        });
        return roots;
    }

    static async getById(id) {
        return db.Size.findOne({ where: { id } });
    }

    static async create(data) {
        const slug = data.slug || slugify(data.name);
        return db.Size.create({ ...data, slug });
    }

    static async update(id, data) {
        if (data.name && !data.slug) data.slug = slugify(data.name);
        await db.Size.update(data, { where: { id } });
        return db.Size.findOne({ where: { id } });
    }

    static async delete(id) {
        if (db.ProductVariantSize) {
            const inUse = await db.ProductVariantSize.count({ where: { size_id: id } });
            if (inUse > 0) {
                throw ApiError.BadRequest(`Bu ölçeg ${inUse} wariantda ulanylýar, ilki olary aýryň`);
            }
        }
        return db.Size.destroy({ where: { id } });
    }
}

module.exports = SizeService;
