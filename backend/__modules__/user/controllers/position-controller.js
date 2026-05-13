const { Op, col, fn } = require("sequelize")
const { FUNCTIONS } = require("../../../utils/functions")
const ApiError = require("../../../exceptions/api-error")
const PositionService = require("../services/positions")
const db = require("../../../models")
const RoleService = require("../services/roles")

class PositionController {
    //#region routes
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = await this.getFilter(req.query)
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req)
            const data = await PositionService.get(filter, limit, sort, skip, paranoid)
            const count = await PositionService.getCount(filter, paranoid)
            return res.status(200).json({ data, count })
        } catch (e) {
            next(e)
        }
    }

    static async getCount(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = await this.getFilter(req.query)
            const count = await PositionService.getCount(filter, paranoid)
            return res.status(200).json({ count })
        } catch (e) {
            next(e)
        }
    }

    static async getElements(req, res, next) {
        try {
            const roles = await RoleService.getForFilter();
            return res.status(200).json({ roles })
        } catch (e) {
            next(e)
        }
    }

    static async getByDepartment(req, res, next) {
        try {
            const data = await db.UserPosition.findAll({
                attributes: [
                    'department',
                    [col('_department.name'), 'departmentName'],
                    'type',
                    [fn('SUM', col('seats')), 'seatsCount'],
                    [fn('COUNT', col('users.id')), 'usersCount'],
                ],
                include: [
                    {
                        model: db.Department,
                        as: '_department',
                        attributes: [], // We get name via col
                    },
                    {
                        model: db.User,
                        as: 'users',
                        attributes: [],
                        required: false, // Include empty positions too
                    },
                ],
                group: ['_department.id', 'positions.type', 'positions.department'],
                raw: true,
            })
            const result = {};
            data.forEach(item => {
                if (item.department === null) return;
                const deptId = item.department;
                const deptName = item.departmentName;
                const type = item.type;

                if (!result[deptId]) {
                    result[deptId] = {
                        department: deptId,
                        departmentName: deptName,
                        types: {}
                    };
                }

                result[deptId].types[type] = {
                    seatsCount: item.seatsCount,
                    usersCount: item.usersCount
                };
            });
            return res.status(200).json({ data: Object.values(result) })
        } catch (e) {
            next(e)
        }
    }

    static async getById(req, res, next) {
        try {
            const model = await PositionService.getById(req.params.id)
            return res.status(200).json({ model })
        } catch (e) {
            next(e)
        }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await this.validate(req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await PositionService.create(req);
            res.status(200).json({ model });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async update(req, res, next) {
        try {
            let model = await PositionService.getById(req.params?.id)
            if (!model) throw ApiError.NotFound()
            model.name = req.body?.name
            model.department = req.body?.department
            model.role_id = req.body?.role_id
            model.seats = req.body?.seats
            model.type = req.body?.type
            model.room = req.body?.room
            model.order = FUNCTIONS.getNumber(req.body?.order)
            model.status = FUNCTIONS.getNumber(req.body?.status)
            const { isError, errors } = await this.validate(model)
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
            PositionService.delete(req.params.id)
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
        const { paranoid, name, text, department, type, status } = params || {};
        if (name) filter.name = { [Op.iLike]: `%${name}%` };
        if (text) filter.name = { [Op.iLike]: `%${text}%` };
        if (parseInt((department))) filter.department = { [Op.eq]: department };
        if (!isNaN(parseInt((type)))) filter.type = { [Op.eq]: type };
        if (!isNaN(parseInt(status))) filter.status = { [Op.eq]: status };
        if (paranoid) filter.deletedAt = { [Op.ne]: null };
        return filter;
    }

    static async validate(form) {
        let errors = {}
        if (!FUNCTIONS.checkRequire(form?.name)) {
            errors.name = 'Wezipe ady boş bolup bilmez!'
        } else if (form?.name?.length > 250) {
            errors.name = 'Wezipe ady 250 harpdan gysga bolmaly!'
        }

        if (!FUNCTIONS.checkRequire(form?.department)) {
            errors.department = 'Wezipäniň degişli bölümini saýlaň!'
        }

        if (!FUNCTIONS.checkRequire(form?.type)) {
            errors.type = 'Wezipäniň degişli görnüşini saýlaň!'
        }

        return { isError: errors?.name || errors?.department || errors?.type, errors }
    }
    //#endregion

}
module.exports = PositionController