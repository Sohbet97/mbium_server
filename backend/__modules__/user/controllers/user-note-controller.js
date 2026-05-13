const { Op } = require("sequelize");
const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const UserNoteService = require("../services/user_notes");

class UserNoteController {
    //#region  routes
    static async get(req, res, next) {
        try {
            const filter = await this.getFilter(req.query);
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
            const data = await UserNoteService.get(filter, limit, sort, skip);
            const count = await UserNoteService.getCount(filter);
            return res.status(200).json({ data, count });
        } catch (e) {
            next(e);
        }
    }
    static async getOwn(req, res, next) {
        try {
            const filter = await this.getFilter(req.query);
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
            const data = await UserNoteService.get({ ...filter, createdBy: req?.user?.id }, limit, FUNCTIONS.getSort('date'), skip);
            const count = await UserNoteService.getCount({ ...filter, createdBy: req?.user?.id });
            return res.status(200).json({ data, count });
        } catch (e) {
            next(e);
        }
    }

    static async getCount(req, res, next) {
        try {
            const filter = await this.getFilter(req.query);
            const count = await UserNoteService.getCount(filter);
            return res.status(200).json({ count });
        } catch (e) {
            next(e);
        }
    }

    static async getById(req, res, next) {
        try {
            const model = await UserNoteService.getById(req.params.id);
            return res.status(200).json({ model });
        } catch (e) {
            next(e);
        }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await this.validate(req)
            if (isError) {
                throw ApiError.BadRequest(null, errors)
            }
            const model = await UserNoteService.create(req)
            res.status(200).json({ model })
            next()
        } catch (e) {
            next(e)
        }
    }

    static async update(req, res, next) {
        try {
            const model = await UserNoteService.getById(req.params?.id)
            if (!model) throw ApiError.NotFound()
            model.title = req.body?.title
            model.description = req.body?.description
            model.color = req.body?.color
            model.status = req.body?.status
            model.date = req.body?.date
            model.time = req.body?.time
            const { isError, errors } = await this.validate(model, true)
            if (isError) throw ApiError.BadRequest(null, errors)
            await model.save()
            res.status(200).json({ model })
            next()
        } catch (e) {
            next(e)
        }
    }

    static async delete(req, res, next) {
        try {
            await UserNoteService.delete(req.params.id)
            res.sendStatus(200)
            next()
        } catch (e) {
            next(e)
        }
    }
    //#endregion

    //#region utils
    static async getFilter(params) {
        const filter = {}
        if (params) {
            if (params.text) {
                filter[Op.or] = [
                    { title: { [Op.iLike]: `%${params.text}%` } },
                    { description: { [Op.iLike]: `%${params.text}%` } }
                ]
            }
            if (params.type) {
                filter.type = { [Op.eq]: params.type }
            }
            if (params.status) {
                filter.status = { [Op.eq]: params.status }
            }
            if (params.date) {
                filter.date = { [Op.eq]: params.date }
            }

            if (params.start_date && params.start_date != null) {
                if (params?.end_date && params.end_date != null) {
                    filter.date = {
                        [Op.and]: [
                            { [Op.gte]: params.start_date },
                            { [Op.lte]: params.end_date }
                        ]
                    }
                } else {
                    filter.date = { [Op.gte]: params.start_date }
                }
            } else if (params.end_date && params.end_date != null) {
                filter.date = { [Op.lte]: params.end_date }
            }

            if (params.color) {
                filter.color = { [Op.eq]: params.color }
            }
            if (params.user) {
                filter.createdBy = { [Op.eq]: params.user }
            }
        }
        return filter
    }

    static async validate(req) {
        let errors = {}
        if (!FUNCTIONS.checkRequire(req?.body?.title)) {
            errors.title = 'Bellik adyny giriziň'
        }

        return { isError: errors?.title, errors }
    }
    //#endregion
}

module.exports = UserNoteController