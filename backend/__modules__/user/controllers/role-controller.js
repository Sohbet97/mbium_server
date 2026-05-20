const { Op } = require("sequelize");
const { FUNCTIONS } = require("../../../utils/functions");
const ApiError = require("../../../exceptions/api-error");
const RoleService = require("../services/roles");

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
            next(e);
        }
    }

    static async getById(req, res, next) {
        try {
            const model = await RoleService.getById(req.params.id);
            return res.status(200).json({ model });
        } catch (e) {
            next(e);
        }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = this.validate(req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await RoleService.create(req);
            return res.status(201).json({ model });
        } catch (e) {
            next(e);
        }
    }

    static async update(req, res, next) {
        try {
            const { isError, errors } = this.validate(req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await RoleService.update(req.params.id, req.body);
            return res.status(200).json({ model });
        } catch (e) {
            next(e);
        }
    }

    static async delete(req, res, next) {
        try {
            await RoleService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) {
            next(e);
        }
    }
    //#endregion

    //#region utils
    static getFilter(params) {
        const filter = {};
        if (params) {
            if (params.text) filter.name = { [Op.iLike]: `%${params.text}%` };
            if (!isNaN(Number(params?.status))) filter.status = { [Op.eq]: params.status };
        }
        return filter;
    }

    static validate(form) {
        const errors = {};
        if (!FUNCTIONS.checkRequire(form?.name)) {
            errors.name = 'Roluň ady boş bolup bilmez!';
        } else if (form?.name?.length > 250) {
            errors.name = 'Roluň ady 250 harpdan gysga bolmaly!';
        }
        return { isError: !!errors.name, errors };
    }
    //#endregion
}

module.exports = RoleController;
