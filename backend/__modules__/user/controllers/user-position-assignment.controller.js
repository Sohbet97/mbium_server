//#region Imports
const { Op } = require("sequelize");
const ApiError = require("../../../exceptions/api-error");
const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const UserPositionAssignmentService = require("../services/user-position-assignment.service");
const userPositionAssignmentSchema = require("../validators/user-position-assignment.schema");
const PositionService = require("../services/positions");
const Validator = require("../../../__artefacts__/_validator_");
//#endregion

class UserPositionAssignmentController {
    //#region routes
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = await this.getFilter(req.query);
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
            const data = await UserPositionAssignmentService.get(filter, limit, sort, skip, paranoid);
            const count = await UserPositionAssignmentService.getCount(filter, paranoid);
            return res.status(200).json({ data, count });
        } catch (e) {
            next(e);
        }
    }

    static async getCount(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = await this.getFilter(req.query);
            const count = await UserPositionAssignmentService.getCount(filter, paranoid);
            return res.status(200).json({ count });
        } catch (e) {
            next(e);
        }
    }

    static async getById(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const model = await UserPositionAssignmentService.getById(req?.params?.id, paranoid);
            if (!model) throw ApiError.NotFound("Assignment not found");
            return res.status(200).json({ model });
        } catch (e) {
            next(e);
        }
    }

    static async getElements(req, res, next) {
        try {
            const positions = await PositionService.getForFilter();
            return res.status(200).json({ positions });
        } catch (e) {
            next(e);
        }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(userPositionAssignmentSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await UserPositionAssignmentService.create(req);
            res.status(200).json({ model });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async update(req, res, next) {
        try {
            let model = await UserPositionAssignmentService.getById(req?.params?.id);
            if (!model) throw ApiError.NotFound("Assignment not found");

            model.user_id = req.body?.user_id;
            model.position_id = req.body?.position_id;
            model.assignment_type = req.body?.assignment_type;
            model.replaced_assignment_id = FUNCTIONS.getNumber(req.body?.replaced_assignment_id) || null;
            model.started_at = req.body?.started_at;
            model.ended_at = req.body?.ended_at || null;
            model.is_active = req.body?.is_active;

            const { isError, errors } = await Validator.validate(userPositionAssignmentSchema, model);
            if (isError) throw ApiError.BadRequest(null, errors);

            await model.save();
            res.status(200).json(model);
            next();
        } catch (e) {
            next(e);
        }
    }

    static async delete(req, res, next) {
        try {
            await UserPositionAssignmentService.delete(req.params.id);
            res.sendStatus(200);
            next();
        } catch (e) {
            next(e);
        }
    }

    static async forceDelete(req, res, next) {
        try {
            await UserPositionAssignmentService.delete(req.params.id, true);
            res.sendStatus(200);
            next();
        } catch (e) {
            next(e);
        }
    }

    static async restore(req, res, next) {
        try {
            const id = req.params?.id;
            if (!id) throw ApiError.BadRequest('Id parameter is required');
            const model = await db.UserPositionAssignment.findOne({ where: { id }, paranoid: false });
            if (!model) throw ApiError.NotFound("Assignment not found");
            if (model && model?.deletedAt) await model.restore();
            res.sendStatus(200);
            next();
        } catch (e) {
            next(e);
        }
    }
    //#endregion

    //#region utils
    // static async getFilter(params) {
    //     const { user_id, position_id, assignment_type, is_active, paranoid } = params || {};
    //     const filter = {};
    //     if (user_id) filter.user_id = user_id;
    //     if (position_id) filter.position_id = position_id;
    //     if (assignment_type) filter.assignment_type = assignment_type;
    //     if (is_active !== undefined) filter.is_active = is_active === 'true' || is_active === true;
    //     if (paranoid) filter.deletedAt = { [Op.ne]: null };
    //     return filter;
    // }

    static async getFilter(params) {
        const { user_id, position_id, assignment_type, is_active, paranoid, text, department_id, department } = params || {};
        const filter = {};
        if (user_id) filter.user_id = user_id;
        if (position_id) filter.position_id = position_id;
        if (assignment_type) filter.assignment_type = assignment_type;
        if (is_active !== undefined) {
            filter.is_active = is_active === 'true' || is_active === true;
        }

        if (department_id) filter['$position.department$'] = department_id;
        if (department) filter['$position.department$'] = department;

        if (text) {
            filter[Op.or] = [
                { '$user.id$': { [Op.iLike]: `%${text}%` } },
                { '$user.name$': { [Op.iLike]: `%${text}%` } },
                { '$user.surname$': { [Op.iLike]: `%${text}%` } },
                { '$user.second_name$': { [Op.iLike]: `%${text}%` } },
            ];
        }

        if (paranoid) filter.deletedAt = { [Op.ne]: null };
        return filter;
    }
    //#endregion
}

module.exports = UserPositionAssignmentController;