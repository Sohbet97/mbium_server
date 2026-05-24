const db = require("../../../models");

class AuditService {
    static async log({ entity_type, entity_id, action, actor_id, ip_address, description }) {
        if (!db.AuditLog) return;
        await db.AuditLog.create({
            entity_type,
            entity_id:   entity_id   ? String(entity_id) : null,
            action,
            actor_id:    actor_id    || null,
            ip_address:  ip_address  || null,
            description: description || null,
        }).catch(() => {});
    }

    static async getAll(
        { entity_type, actor_id, action, date_from, date_to, search } = {},
        limit = 50,
        offset = 0
    ) {
        const { Op } = require("sequelize");
        const where = {};

        if (entity_type) where.entity_type = entity_type;
        if (actor_id)    where.actor_id    = actor_id;
        if (action)      where.action      = action;
        if (search)      where.description = { [Op.iLike]: `%${search}%` };

        if (date_from || date_to) {
            where.createdAt = {};
            if (date_from) where.createdAt[Op.gte] = new Date(date_from);
            if (date_to)   where.createdAt[Op.lte] = new Date(date_to);
        }

        const [data, count] = await Promise.all([
            db.AuditLog.findAll({
                where,
                limit,
                offset,
                order: [["createdAt", "DESC"]],
                include: [{
                    model: db.User,
                    as: "actor",
                    attributes: ["id", "name", "surname", "phone_number"],
                    required: false,
                }],
            }),
            db.AuditLog.count({ where }),
        ]);

        return { data, count };
    }
}

module.exports = AuditService;
