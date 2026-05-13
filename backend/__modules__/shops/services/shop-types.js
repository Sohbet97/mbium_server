const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const SHOP_CONSTANTS = require("../utils/constants");

class ShopTypeService {
    static async get(filter = {}, limit = undefined, order = SHOP_CONSTANTS.DEFAULT_SORT, offset = 0, paranoid = true) {
        const data = await db.ShopType.findAll({
            where: filter,
            offset,
            order,
            limit,
            paranoid
        });
        return data;
    }

    static async getCount(filter = {}, paranoid = true) {
        const count = await db.ShopType.count({
            where: filter,
            paranoid
        });
        return count;
    }

    static async getById(id, paranoid = true) {
        if(!id) return;
        const model = await db.ShopType.findOne({
            where: { id },
            paranoid
        });
        return model;
    }

    static async create(req) {
        const model = await db.ShopType.create({
            name: req.body?.name,
            name_ru: req.body?.name_ru,
            name_eng: req.body?.name_eng,
            is_active: req.body?.is_active,
            order: FUNCTIONS.getNumber(req.body?.order) || null,
            createdBy: req.user?.id
        });
        return model;
    }

    static async update(id, req) {
        if(!id) return;
        const model = await db.ShopType.update({
            name: req.body?.name,
            name_ru: req.body?.name_ru,
            name_eng: req.body?.name_eng,
            is_active: req.body?.is_active,
            order: FUNCTIONS.getNumber(req.body?.order) || null,
        }, { where: { id } });
        return model;
    }

    static async delete(id, force = false) {
        if(!id) return;
        await db.ShopType.destroy({ where: { id }, force });
    }
}

module.exports = ShopTypeService;