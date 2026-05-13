const db = require("../../../models")
const { FUNCTIONS } = require("../../../utils/functions")

class PositionService {
    static async get(filter = {}, limit = undefined, sort = undefined, skip = 0, paranoid = true) {
        const data = await db.UserPosition.findAll({
            where: filter,
            offset: skip,
            order: [sort],
            limit: limit,
            paranoid,
            attributes: {
                exclude: ['createdBy, updatedAt']
            },
            include: [
                {
                    model: db.Department,
                    as: '_department',
                    attributes: ['name']
                },
                {
                    model: db.User,
                    as: 'users',
                    attributes: ['id', 'name', 'surname', 'second_name']
                }
            ]
        })
        return data
    }

    static async getForFilter() {
        const data = await db.UserPosition.findAll({
            attributes: ['id', 'name', 'department', 'seats'],
            order: [FUNCTIONS.getSort('name')],
            include: [
                {
                    model: db.User,
                    as: 'users',
                    attributes: ['id']
                }
            ]
        })
        return data
    }

    static async getCount(filter = {}, paranoid = true) {
        const count = await db.UserPosition.count({
            where: filter,
            paranoid,
        })
        return count
    }

    static async getById(id) {
        const model = await db.UserPosition.findOne({
            where: {
                id
            },
            attributes: {
                exclude: ['createdBy, updatedAt']
            },
            include: [
                {
                    model: db.Department,
                    as: '_department',
                    attributes: ['name']
                },
                {
                    model: db.User,
                    as: 'users',
                    attributes: ['id', 'name', 'surname', 'second_name']
                }
            ]
        })
        return model
    }

    static async getByDepartment() {
        const data = await db.Department.findAll({
            attributes: ['id', 'name'],
            include: [
                {
                    model: db.UserPosition,
                    as: 'positions',
                    attributes: ['id', 'name', 'type']
                }
            ]
        })
        return data
    }

    static async create(req) {
        const model = await db.UserPosition.create({
            name: req.body?.name,
            department: req.body?.department,
            seats: req.body?.seats,
            type: req.body?.type,
            role_id: req.body?.role_id,
            room: req.body?.room,
            status: FUNCTIONS.getNumber(req.body?.status),
            order: FUNCTIONS.getNumber(req.body?.order),
            createdBy: req.user?.id
        })
        return model
    }


    static async delete(id) {
        db.UserPosition.destroy({ where: { id } })
    }

}

module.exports = PositionService