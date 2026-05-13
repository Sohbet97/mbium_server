const { Op } = require("sequelize")
const ApiError = require("../exceptions/api-error")
const VillageService = require("../services/villages")
const { FUNCTIONS } = require("../utils/functions")
const db = require("../models")
const STATUSES = require("../utils/statuses")

class VillageController {
    //#region  routes
    static async get(req, res, next) {
        try {
            const filter = await this.getFilter(req.query)
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req)
            const data = await VillageService.get(filter, limit, sort, skip)
            const count = await VillageService.getCount(filter)
            return res.status(200).json({ data, count })
        } catch (e) {
            next(e)
        }
    }

    static async getCount(req, res, next) {
        try {
            const filter = await this.getFilter(req.query)
            const count = await VillageService.getCount(filter)
            return res.status(200).json({ count })
        } catch (e) {
            next(e)
        }
    }

    static async getById(req, res, next) {
        try {
            const model = await VillageService.getById(req.params.id)
            return res.status(200).json({ model })
        } catch (e) {
            next(e)
        }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await this.validate(req.body);
            if (isError) {
                throw ApiError.BadRequest(null, errors);
            }
            const model = await VillageService.create(req);
            await this.sync(model?.id, req?.user?.user);
            res.status(200).json({ model });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async update(req, res, next) {
        try {
            const model = await VillageService.getById(req.params?.id);
            if (!model) throw ApiError.NotFound();
            model.name = req.body?.name;
            model.ssu_code = req.body?.ssu_code;
            model.district = FUNCTIONS.getNumber(req.body?.district) || null;
            model.order = FUNCTIONS.getNumber(req.body?.order) || null;
            model.type = FUNCTIONS.getNumber(req.body?.type);
            model.status = FUNCTIONS.getNumber(req.body?.status);
            const { isError, errors } = await this.validate(model, true);
            if (isError) throw ApiError.BadRequest(null, errors);
            await model.save();
            await this.sync(model?.id, req?.user?.user);
            res.status(200).json({ model });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async delete(req, res, next) {
        try {
            await VillageService.delete(req.params.id)
            res.sendStatus(200)
            next()
        } catch (e) {
            next(e)
        }
    }

    static async sync(id, user) {
        return;
    }
    //#endregion

    //#region utils
    static async getFilter(params) {
        const filter = {}
        if (params) {
            if (params.text) {
                filter[Op.or] = [
                    { name: { [Op.iLike]: `%${params.text}%` } }
                ]
            }
            if (params.district) {
                filter.district = { [Op.eq]: params.district }
            }
            if (!isNaN(Number(params?.status))) filter.status = { [Op.eq]: params.status }
        }
        return filter
    }

    static async validate(form) {
        let errors = {}
        const oldModel = await db.Village.findOne({
            where: {
                [Op.and]: {
                    name: { [Op.eq]: form?.name },
                    id: (form?.id ? { [Op.ne]: form?.id } : { [Op.gt]: 0 })
                }
            }
        })
        if (!FUNCTIONS.checkRequire(form?.name)) {
            errors.name = 'Etrapça ady boş bolup bilmez!'
        } else if (oldModel && oldModel != null) {
            errors.name = `${form?.name} atly etrapça ozal hasaba alnan`
        } else if (form?.name?.length > 100) {
            errors.name = 'Etrapça ady 100 harpdan gysga bolmaly'
        }

        if (!FUNCTIONS.checkRequire(form?.district)) errors.district = 'Etrapçanyň haýsy etraba (şähere) degişlidigini saýlaň!'

        if (FUNCTIONS.checkRequire(form?.order) && form.order > 255) errors.order = 'Tertip belgisi 255-den uly bolmaly däl!'

        return { isError: errors.name || errors.district || errors.order, errors }
    }
    //#endregion
}

module.exports = VillageController