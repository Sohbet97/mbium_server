const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");

class UserPositionAssignmentService {
    static async get(filter = {}, limit = undefined, sort = FUNCTIONS.getSort('-createdAt'), skip = 0, paranoid = true) {
        const data = await db.UserPositionAssignment.findAll({
            where: filter,
            offset: skip,
            order: [sort],
            limit: limit,
            paranoid,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'name', 'surname', 'second_name']
                },
                {
                    model: db.UserPosition,
                    as: 'position',
                    attributes: ['id', 'name', 'department', 'room'],
                    include: [
                        {
                            model: db.Department,
                            as: '_department',
                            attributes: ['name']
                        }
                    ]
                }
            ]
        });
        return data;
    }

    static async getCount(filter = {}, paranoid = true) {
        const count = await db.UserPositionAssignment.count({
            where: filter,
            paranoid,
            include: [
                { model: db.User, as: 'user' },
                { model: db.UserPosition, as: 'position' }
            ]
        });
        return count;
    }

    static async getById(id, paranoid = true) {
        const model = await db.UserPositionAssignment.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.User, as: 'user' },
                { model: db.UserPosition, as: 'position' },
                { model: db.UserPositionAssignment, as: 'replaced_assignment' }
            ]
        });
        return model;
    }

    static async create(req) {
        const model = await db.UserPositionAssignment.create({
            user_id: req.body?.user_id,
            position_id: req.body?.position_id,
            assignment_type: req.body?.assignment_type,
            replaced_assignment_id: FUNCTIONS.getNumber(req.body?.replaced_assignment_id) || null,
            started_at: req.body?.started_at,
            ended_at: req.body?.ended_at || null,
            is_active: req.body?.is_active || false,
        });
        return model;
    }

    static async delete(id, force = false) {
        await db.UserPositionAssignment.destroy({ where: { id }, force });
    }
}

module.exports = UserPositionAssignmentService;