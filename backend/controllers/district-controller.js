const { Op, where } = require("sequelize")
const ApiError = require("../exceptions/api-error")
const db = require("../models")
const { FUNCTIONS } = require("../utils/functions")
const DistrictService = require("../services/districts")
const STATUSES = require("../utils/statuses")

class DistrictController {
    //#region  routes
    static async get(req, res, next) {
        try {
            const filter = await this.getFilter(req.query)
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req)
            const data = await DistrictService.get(filter, limit, sort, skip)
            const count = await DistrictService.getCount(filter)
            return res.status(200).json({ data, count })
        } catch (e) {
            next(e)
        }
    }

    static async getCount(req, res, next) {
        try {
            const filter = await this.getFilter(req.query)
            const count = await DistrictService.getCount(filter)
            return res.status(200).json({ count })
        } catch (e) {
            next(e)
        }
    }

    static async getById(req, res, next) {
        try {
            const model = await DistrictService.getById(req.params.id)
            return res.status(200).json({ model })
        } catch (e) {
            next(e)
        }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await this.validate(req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await DistrictService.create(req);
            await this.sync(model?.id, req?.user?.user);
            res.status(200).json({ model });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async update(req, res, next) {
        try {
            let model = await DistrictService.getById(req.params?.id);
            if (!model) throw ApiError.NotFound();
            model.name = req.body?.name;
            model.ssu_code = req.body?.ssu_code;
            model.region = FUNCTIONS.getNumber(req.body?.region) || null;
            model.type = FUNCTIONS.getNumber(req.body?.type);
            model.status = FUNCTIONS.getNumber(req.body?.status);
            model.order = FUNCTIONS.getNumber(req.body?.order) || null;
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
            let model = await DistrictService.getById(req.params?.id)
            if (!model) throw ApiError.NotFound()
            await model.destroy()
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
                    // {short_name:{[Op.iLike]:`%${params.text}%`}},
                ]
            }
            if (params.region) filter.region = { [Op.eq]: params.region }
            if (!isNaN(Number(params?.status))) filter.status = { [Op.eq]: params.status }
        }
        return filter
    }

    static async validate(form) {
        let errors = {}
        const oldModel = await db.District.findOne({
            where: {
                [Op.and]: {
                    name: { [Op.eq]: form?.name },
                    type: { [Op.eq]: form?.type },
                    id: (form?.id ? { [Op.ne]: form?.id } : { [Op.gt]: 0 })
                }
            }
        })
        if (!FUNCTIONS.checkRequire(form?.name)) {
            errors.name = 'Etrap ady boş bolup bilmez!'
        } else if (oldModel && oldModel != null) {
            errors.name = `${form?.name} atly etrap ozal hasaba alnan!`
        } else if (form?.name?.length > 100) {
            errors.name = 'Etrap ady 100 harpdan gysga bolmaly!'
        }

        if (!FUNCTIONS.checkRequire(form?.region)) errors.region = 'Welaýaty saýlaň!'

        if (FUNCTIONS.checkRequire(form?.order) && form.order > 255) errors.order = 'Tertip belgisi 255-den uly bolmaly däl!'

        return { isError: errors.name || errors.region || errors.order, errors }
    }
    //#endregion
}

module.exports = DistrictController