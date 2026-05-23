const db = require('../../../models');

const TYPE_ATTRS = ['id', 'name', 'name_ru', 'name_eng'];
const USER_ATTRS = ['id', 'name', 'surname'];
const SHOP_ATTRS = ['id', 'name'];

class ShopTypeChangeRequestService {
    static async getAll({ shop_id, status } = {}, limit, offset = 0) {
        const where = {};
        if (shop_id !== undefined) where.shop_id = shop_id;
        if (status  !== undefined) where.status  = status;
        return db.ShopTypeChangeRequest.findAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                { model: db.Shop,     as: 'shop',          attributes: SHOP_ATTRS },
                { model: db.ShopType, as: 'currentType',   attributes: TYPE_ATTRS },
                { model: db.ShopType, as: 'requestedType', attributes: TYPE_ATTRS },
                { model: db.User,     as: 'requester',     attributes: USER_ATTRS },
                { model: db.User,     as: 'reviewer',      attributes: USER_ATTRS },
            ],
        });
    }

    static async getCount(filter = {}) {
        return db.ShopTypeChangeRequest.count({ where: filter });
    }

    static async getLatestForShop(shop_id) {
        return db.ShopTypeChangeRequest.findOne({
            where: { shop_id },
            order: [['createdAt', 'DESC']],
            include: [
                { model: db.ShopType, as: 'currentType',   attributes: TYPE_ATTRS },
                { model: db.ShopType, as: 'requestedType', attributes: TYPE_ATTRS },
            ],
        });
    }

    static async getPendingForShop(shop_id) {
        return db.ShopTypeChangeRequest.findOne({
            where: { shop_id, status: 0 },
        });
    }

    static async create({ shop_id, current_type_id, requested_type_id, requested_by }) {
        return db.ShopTypeChangeRequest.create({
            shop_id,
            current_type_id,
            requested_type_id,
            requested_by: requested_by ?? null,
            status: 0,
        });
    }

    static async approve(id, reviewed_by) {
        const req = await db.ShopTypeChangeRequest.findOne({ where: { id } });
        if (!req) return null;

        await req.update({ status: 1, reviewed_by, reviewed_at: new Date() });
        await db.Shop.update({ type_id: req.requested_type_id }, { where: { id: req.shop_id } });

        // Reject all other pending requests for this shop
        await db.ShopTypeChangeRequest.update(
            { status: 2, reviewed_by, reviewed_at: new Date(), note: 'Superseded by approved request' },
            { where: { shop_id: req.shop_id, status: 0, id: { [db.Sequelize.Op.ne]: id } } }
        );

        return req;
    }

    static async reject(id, note, reviewed_by) {
        const req = await db.ShopTypeChangeRequest.findOne({ where: { id } });
        if (!req) return null;
        await req.update({ status: 2, note: note ?? null, reviewed_by, reviewed_at: new Date() });
        return req;
    }
}

module.exports = ShopTypeChangeRequestService;
