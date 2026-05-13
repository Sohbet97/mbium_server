const { Op } = require("sequelize")
const { FUNCTIONS } = require("../utils/functions")
const db = require("../models")
const { STATUSE_ACTIVE } = require("../utils/statuses")

class RegionService {
    static async get(filter = {}, limit = undefined, sort = undefined, skip = 0) {
        const options = {
            where: filter,
            offset: skip,
            limit: limit
        };
        if (sort) {
            options.order = [sort];
        }
        const data = await db.Region.findAll(options);
        return data;
    }

    static async getForFilter() {
        const data = await db.Region.findAll({
            attributes: { exclude: ['createdBy', 'updatedAt'] },
            where: { status: { [Op.eq]: STATUSE_ACTIVE } },
            order: [FUNCTIONS.getSort('order')]
        })
        return data
    }

    static async getCount(filter = {}) {
        const count = await db.Region.count({
            where: filter
        })
        return count
    }

    static async getById(id) {
        const model = await db.Region.findOne({
            where: { id }
        })
        return model
    }

    static async create(req) {
        const model = await db.Region.create({
            name: req.body?.name,
            short_name: req.body?.short_name,
            ssu_code: req.body?.ssu_code,
            isPolyclinical: req.body?.isPolyclinical,
            type: FUNCTIONS.getNumber(req.body?.type),
            status: FUNCTIONS.getNumber(req.body?.status),
            order: FUNCTIONS.getNumber(req.body?.order) || null,
            createdBy: req.user?.id
        })
        return model
    }

    static async delete(id) {
        await db.Region.destroy({ where: { id } })
    }
}

module.exports = RegionService