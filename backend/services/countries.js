const { Op } = require("sequelize");
const { FUNCTIONS } = require("../utils/functions");
const db = require("../models");
const { STATUSE_ACTIVE } = require("../utils/statuses");

class CountryService {
    /**
     * 
     * @param {Object} req 
     * @returns Array of countries according by filter
     */
    static async get(req) {
        const limit = FUNCTIONS.getLimit(req);
        const sort = await FUNCTIONS.getSort(req.query?.sort);
        const filter = await this.getFilter(req.query);
        const skip = req.query?.page ? (req.query?.page - 1) * limit : undefined;
        const data = await db.Country.findAll({
            where: filter,
            attributes: { exclude: ['createdBy', 'updatedAt'] },
            offset: skip,
            order: [sort],
            limit: limit
        });
        return data;
    }

    /**
     * 
     * @param {Object} req 
     * @returns Count of countries according by filter
     */
    static async getCount(req) {
        const filter = await this.getFilter(req.query);
        const count = await db.Country.count({
            where: filter
        });
        return count;
    }

    static async getForFilter() {
        const data = await db.Country.findAll({
            attributes: ["id", "name", "thumbnail", "code", "order", "status", "uuid", "createdAt"],
            where: { status: { [Op.eq]: STATUSE_ACTIVE } },
            order: [FUNCTIONS.getSort('order')]
        });
        return data;
    }

    /**
     * 
     * @param {String|number} id 
     * @returns Country model by given primary key
     */
    static async getById(id) {
        const model = await db.Country.findOne({
            attributes: ["id", "name", "thumbnail", "code", "order", "status", "uuid", "createdAt"],
            where: { id }
        });
        return model;
    }

    /**
     * 
     * @param {object} req
     * @description Creates model with given params and returns created model  
     * @returns Country model
     */
    static async create(req) {
        const model = await db.Country.create({
            name: req.body?.name,
            code: req.body?.code,
            ssu_code: req.body?.ssu_code,
            status: FUNCTIONS.getNumber(req.body?.status),
            order: FUNCTIONS.getNumber(req.body?.order),
            createdBy: req.user?.id
        });
        return model;
    }

    static async update(id, body) {
        const model = await this.getById(id);
        await model.update({
            name: body?.name,
            code: body?.code
        });
        return model;
    }

    static async delete(id) {
        db.Country.destroy({ where: { id } });
    }

    static async getFilter(params) {
        const filter = {};
        if (params) {
            if (params.name) {
                filter.name = { [Op.iLike]: `%${params.name}%` };
            }
            if (params.code) {
                filter.code = { [Op.iLike]: `%${params.code}%` };
            }
            if (params.text) {
                filter[Op.or] = [
                    { name: { [Op.iLike]: `%${params?.text}%` } },
                    { code: { [Op.iLike]: `%${params?.text}%` } }
                ]
            }

            if (!isNaN(Number(params?.status))) filter.status = { [Op.eq]: params.status }
        }
        return filter;
    }

    static async validate(form) {
        let errors = {};

        if (!FUNCTIONS.checkRequire(form?.name)) {
            errors.name = 'Döwlet adyny giriziň'
        } else {
            errors.name = null;
        }

        if (!FUNCTIONS.checkRequire(form?.code)) {
            errors.code = 'Döwlet koduny giriziň'
        } else {
            errors.code = null;
        }

        return { isError: errors.name || errors.code, errors };
    }
}

module.exports = CountryService;