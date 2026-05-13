const { Op, where } = require("sequelize")
const ApiError = require("../exceptions/api-error")
const db = require("../models")
const RegionService = require("../services/regions")
const { FUNCTIONS } = require("../utils/functions")
const STATUSES = require("../utils/statuses")

class RegionController {
    //#region  routes
    static async get(req, res, next) {
        try {
            const filter = await this.getFilter(req.query)
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req)
            const data = await RegionService.get(filter, limit, sort, skip)
            const count = await RegionService.getCount(filter)
            return res.status(200).json({ data, count })
        } catch (e) {
            next(e)
        }
    }

    static async getCount(req, res, next) {
        try {
            const filter = await this.getFilter(req.query)
            const count = await RegionService.getCount(filter)
            return res.status(200).json({ count })
        } catch (e) {
            next(e)
        }
    }

    static async getById(req, res, next) {
        try {
            const model = await RegionService.getById(req.params.id)
            return res.status(200).json({ model })
        } catch (e) {
            next(e)
        }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await this.validate(req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await RegionService.create(req);
            await this.sync(model?.id, req?.user?.user);
            res.status(200).json({ model });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async update(req, res, next) {
        try {
            let model = await RegionService.getById(req.params?.id);
            if (!model) throw ApiError.NotFound();
            model.name = req.body?.name;
            model.short_name = req.body?.short_name;
            model.ssu_code = req.body?.ssu_code;
            model.isPolyclinical = req.body?.isPolyclinical;
            model.order = FUNCTIONS.getNumber(req.body?.order) || null;
            model.status = FUNCTIONS.getNumber(req.body?.status);
            model.type = FUNCTIONS.getNumber(req.body?.type);
            const { isError, errors } = await this.validate(model);
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
            await RegionService.delete(req.params.id)
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
                    { name: { [Op.iLike]: `%${params.text}%` } },
                    { short_name: { [Op.iLike]: `%${params.text}%` } },
                ]
            }
            if (params.short_name) {
                filter.short_name = { [Op.like]: `%${params.short_name}%` }
            }
            if (!isNaN(Number(params?.status))) filter.status = { [Op.eq]: params.status }
        }
        return filter
    }

    static async validate(form) {
        let errors = {}
        const oldModel = await db.Region.findOne({
            where: {
                [Op.and]: {
                    name: { [Op.eq]: form?.name },
                    id: (form?.id ? { [Op.ne]: form?.id } : { [Op.gt]: 0 })
                }
            }
        })
        if (!FUNCTIONS.checkRequire(form?.name)) {
            errors.name = 'Welaýat ady boş bolup bilmez!'
        } else if (oldModel && oldModel != null) {
            errors.name = `${form?.name} atly welaýat ozal hasaba alnan!`
        } else {
            errors.name = null
        }

        if (!FUNCTIONS.checkRequire(form?.short_name)) {
            errors.short_name = 'Welaýatyň gysga ady boş bolup bilmez!'
        } else if (!FUNCTIONS.checkOnlyLetters(form?.short_name)) {
            errors.short_name = 'Welaýatyň gysga ady diňe harplardan ybarat bolmaly!'
        } else if (form?.short_name?.length > 2) {
            errors.short_name = 'Welaýatyň gysga ady 2 harpdan ybarat bolmaly!'
        } else {
            errors.short_name = null
        }

        if (FUNCTIONS.checkRequire(form?.order) && form.order > 255) {
            errors.order = 'Tertip belgisi 255-den uly bolmaly däl!'
        }

        return { isError: errors.name || errors.short_name || errors.order, errors }
    }
    //#endregion
}

module.exports = RegionController