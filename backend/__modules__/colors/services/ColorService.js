const { Op } = require("sequelize");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");

const HEX_RE = /^#[0-9a-f]{6}$/i;

function slugify(str) {
    return str.toLowerCase().trim().replace(/[^a-z0-9Ѐ-ӿ]+/g, "-").replace(/^-|-$/g, "");
}

/** Accepts `#rgb`, `#rrggbb` or either without the `#`; returns lower-case `#rrggbb` or null. */
function normalizeHex(value) {
    const v = String(value ?? "").trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(v)) return `#${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}`.toLowerCase();
    if (/^[0-9a-f]{6}$/i.test(v)) return `#${v}`.toLowerCase();
    return null;
}

class ColorService {

    static async getAll(filter = {}, limit, skip = 0) {
        return db.Color.findAndCountAll({
            where: filter,
            order: [["sort_order", "ASC"], ["name", "ASC"]],
            limit,
            offset: skip,
        });
    }

    static async getById(id) {
        return db.Color.findOne({ where: { id } });
    }

    static async create(data) {
        const hex = normalizeHex(data.hex);
        if (!hex) throw ApiError.BadRequest("hex #rrggbb görnüşinde bolmaly");

        const slug = data.slug || slugify(data.name);
        const clash = await db.Color.findOne({ where: { [Op.or]: [{ hex }, { slug }] } });
        if (clash) throw ApiError.BadRequest("Bu reňk ýa-da slug eýýäm bar");

        return db.Color.create({ ...data, hex, slug });
    }

    static async update(id, data) {
        const existing = await db.Color.findOne({ where: { id } });
        if (!existing) throw ApiError.NotFound("Reňk tapylmady");

        const patch = { ...data };
        if (data.hex !== undefined) {
            const hex = normalizeHex(data.hex);
            if (!hex) throw ApiError.BadRequest("hex #rrggbb görnüşinde bolmaly");
            patch.hex = hex;
        }
        if (data.name && !data.slug) patch.slug = slugify(data.name);

        if (patch.hex || patch.slug) {
            const clash = await db.Color.findOne({
                where: {
                    id: { [Op.ne]: id },
                    [Op.or]: [
                        ...(patch.hex  ? [{ hex:  patch.hex  }] : []),
                        ...(patch.slug ? [{ slug: patch.slug }] : []),
                    ],
                },
            });
            if (clash) throw ApiError.BadRequest("Bu reňk ýa-da slug eýýäm bar");
        }

        // products.color_hex / product_variants.color_hex are ON UPDATE CASCADE,
        // so changing the hex carries through to everything using it.
        await db.Color.update(patch, { where: { id } });
        return db.Color.findOne({ where: { id } });
    }

    static async delete(id) {
        const color = await db.Color.findOne({ where: { id } });
        if (!color) throw ApiError.NotFound("Reňk tapylmady");

        const [productCount, variantCount] = await Promise.all([
            db.Product.count({ where: { color_hex: color.hex } }),
            db.ProductVariant.count({ where: { color_hex: color.hex } }),
        ]);
        const inUse = productCount + variantCount;
        if (inUse > 0) {
            throw ApiError.BadRequest(`Bu reňk ${inUse} ýerde ulanylýar, ilki olary aýryň`);
        }
        return db.Color.destroy({ where: { id } });
    }

    static buildFilter({ text, is_active } = {}) {
        const filter = {};
        if (is_active !== undefined) filter.is_active = is_active === "true" || is_active === true;
        if (text) {
            filter[Op.or] = [
                { name:     { [Op.iLike]: `%${text}%` } },
                { name_ru:  { [Op.iLike]: `%${text}%` } },
                { name_eng: { [Op.iLike]: `%${text}%` } },
                { hex:      { [Op.iLike]: `%${text}%` } },
            ];
        }
        return filter;
    }

    /**
     * Parse a `color_hex` query value (one hex, or several comma-separated) into
     * a validated, de-duplicated list. Invalid entries are dropped, so a garbage
     * value narrows to nothing rather than throwing.
     */
    static parseHexList(value) {
        if (value == null) return [];
        const raw = Array.isArray(value) ? value : String(value).split(",");
        const out = [];
        for (const item of raw) {
            const hex = normalizeHex(item);
            if (hex && !out.includes(hex)) out.push(hex);
        }
        return out;
    }
}

ColorService.normalizeHex = normalizeHex;
ColorService.HEX_RE = HEX_RE;

module.exports = ColorService;
