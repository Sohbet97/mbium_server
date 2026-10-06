const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");
const { GUIDE_STATUSES } = require("../models/Guide.model");

const FIELDS = [
    "title", "title_ru", "title_eng",
    "description", "description_ru", "description_eng",
    "video", "thumbnail", "order", "status",
];

const ORDER = [["order", "ASC"], ["id", "ASC"]];

function pick(body = {}) {
    const data = {};
    for (const f of FIELDS) if (body[f] !== undefined) data[f] = body[f] === "" ? null : body[f];
    if (data.order !== undefined) data.order = Number(data.order) || 0;
    if (data.status !== undefined) data.status = Number(data.status) === GUIDE_STATUSES.PUBLISHED ? 1 : 0;
    return data;
}

class GuideService {
    static async getAll(filter = {}, limit, skip = 0) {
        return db.Guide.findAndCountAll({ where: filter, order: ORDER, limit, offset: skip });
    }

    // Client list: published only
    static async getPublished() {
        return db.Guide.findAll({ where: { status: GUIDE_STATUSES.PUBLISHED }, order: ORDER });
    }

    static async getById(id) {
        return db.Guide.findOne({ where: { id } });
    }

    static async create(body) {
        const data = pick(body);
        if (!data.title?.trim()) throw ApiError.BadRequest("title is required");
        return db.Guide.create(data);
    }

    static async update(id, body) {
        const guide = await this.getById(id);
        if (!guide) throw ApiError.NotFound("Gollanma tapylmady");
        const data = pick(body);
        if (data.title !== undefined && !String(data.title ?? "").trim()) throw ApiError.BadRequest("title is required");
        await guide.update(data);
        return guide;
    }

    static async delete(id) {
        const deleted = await db.Guide.destroy({ where: { id } });
        if (!deleted) throw ApiError.NotFound("Gollanma tapylmady");
    }
}

module.exports = GuideService;
