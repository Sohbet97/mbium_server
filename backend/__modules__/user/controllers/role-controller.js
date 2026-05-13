const { Op } = require("sequelize");
const { FUNCTIONS } = require("../../../utils/functions");
const ApiError = require("../../../exceptions/api-error");
const RoleService = require("../services/roles");
const STATUSES = require("../../../utils/statuses");

class RoleController {
    //#region routes
    static async get(req, res, next) {
        try {
            const filter = await this.getFilter(req.query);
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
            const data = await RoleService.get(filter, limit, sort, skip);
            const count = await RoleService.getCount(filter);
            return res.status(200).json({ data, count });
        } catch (e) {
            next(e);
        }
    }

    static async getCount(req, res, next) {
        try {
            const filter = await this.getFilter(req.query);
            const count = await RoleService.getCount(filter);
            return res.status(200).json({ count });
        } catch (e) {
            next(e)
        }
    }

    static async getById(req, res, next) {
        try {
            const model = await RoleService.getById(req.params.id);
            return res.status(200).json({ model });
        } catch (e) {
            next(e)
        }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await this.validate(req.body)
            if (isError) throw ApiError.BadRequest(null, errors)
            const model = await RoleService.create(req)
            res.status(200).json({ model })
            next()
        } catch (e) {
            next(e)
        }
    }

    static async update(req, res, next) {
        try {
            let model = await RoleService.getById(req.params?.id);
            if (!model) throw ApiError.NotFound();
            model.name = req.body?.name
            model.permissions = req.body?.permissions
            model.start_page = req.body?.start_page
            model.payment_class = FUNCTIONS.getNumber(req.body?.payment_class) || null
            model.visit_limit = FUNCTIONS.getNumber(req.body?.visit_limit)
            model.lab_limit = FUNCTIONS.getNumber(req.body?.lab_limit)
            model.rad_limit = FUNCTIONS.getNumber(req.body?.rad_limit)
            model.spec_limit = FUNCTIONS.getNumber(req.body?.spec_limit)
            model.inst_limit = FUNCTIONS.getNumber(req.body?.inst_limit)
            model.room_management_limit = FUNCTIONS.getNumber(req.body?.room_management_limit)
            model.document_management_limit = FUNCTIONS.getNumber(req.body?.document_management_limit)
            model.treatment_limit = FUNCTIONS.getNumber(req.body?.treatment_limit)
            model.payment_limit = FUNCTIONS.getNumber(req.body?.payment_limit)
            model.payment_register_journal_limit = FUNCTIONS.getNumber(req.body?.payment_register_journal_limit)
            model.modules = req.body?.modules
            model.order = FUNCTIONS.getNumber(req.body?.order) || null
            model.status = FUNCTIONS.getNumber(req.body?.status)
            const { isError, errors } = await this.validate(model);
            if (isError) throw ApiError.BadRequest(null, errors);
            await model.save();
            res.status(200).json({ model });
            next()
        } catch (e) {
            next(e);
        }
    }

    static async delete(req, res, next) {
        try {
            const id = req.params.id
            if (!id) throw ApiError.BadRequest()
            const model = await RoleService.getById(id)
            if (!model) throw ApiError.NotFound()
            model.status = STATUSES.STATUSE_INACTIVE
            await model.save()
            res.sendStatus(200)
            next()
        } catch (e) {
            next(e)
        }
    }
    //#endregion

    //#region utils
    static async getFilter(params) {
        const filter = {};
        if (params) {
            if (params.text) filter.name = { [Op.iLike]: `%${params.text}%` };

            if (!isNaN(Number(params?.status))) filter.status = { [Op.eq]: params.status }
        }
        return filter;
    }

    static async validate(form) {
        let errors = {};
        if (!FUNCTIONS.checkRequire(form?.name)) {
            errors.name = 'Kesel kesgidiniň ady boş bolup bilmez!'
        } else if (form?.name?.length > 250) {
            errors.name = 'Kesel kesgidiniň ady 250 harpdan gysga bolmaly!';
        }
        return { isError: errors?.name, errors };
    }
    //#endregion

}

module.exports = RoleController;