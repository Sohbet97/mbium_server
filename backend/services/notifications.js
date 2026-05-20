const { Op } = require('sequelize');
const db = require('../models');
const STATUSES = require('../utils/statuses');

class NotificationService {
    static async get(filter = {}, limit = 20, skip = 0) {
        return db.Notification.findAll({
            where: filter,
            offset: skip,
            limit,
            order: [['createdAt', 'DESC']],
        });
    }

    static async getOne(filter = {}) {
        return db.Notification.findOne({ where: filter });
    }

    static async getById(id) {
        return db.Notification.findOne({ where: { id } });
    }

    static async getCount(filter = {}) {
        return db.Notification.count({ where: filter });
    }

    static async create({ userId, type, targetId, content }) {
        return db.Notification.create({
            user_id: userId,
            type,
            target_id: String(targetId),
            content,
            status: 0,
        });
    }

    static async markAsRead(id) {
        await db.Notification.update(
            { status: 1, read_at: new Date() },
            { where: { id } }
        );
    }

    static async markAllAsRead(userId) {
        await db.Notification.update(
            { status: 1, read_at: new Date() },
            { where: { user_id: userId, read_at: { [Op.is]: null } } }
        );
    }

    static async delete(id) {
        await db.Notification.destroy({ where: { id } });
    }

    // Find all active admin users to notify
    static async _getAdminUsers() {
        return db.User.findAll({
            where: { status: STATUSES.USER_ACTIVE },
            include: [{
                model: db.Role,
                as: '_role',
                required: true,
            }],
            attributes: ['id'],
        });
    }

    // Emit socket event and bulk-create DB records
    static async _broadcastToAdmins(type, targetId, content, io) {
        const admins = await this._getAdminUsers();
        if (!admins.length) return;

        const bulk = admins.map((u) => ({
            user_id: u.id,
            type,
            target_id: String(targetId),
            content,
            status: 0,
        }));

        const records = await db.Notification.bulkCreate(bulk);

        if (io) {
            admins.forEach((u, idx) => {
                io.to(u.id).emit('notification', records[idx]);
            });
        }

        return records;
    }

    static async createForOrder(order, io) {
        const content = `Täze sargyt #${order?.id ?? order} geldi`;
        return this._broadcastToAdmins(STATUSES.NOT_ORDER, order?.id ?? order, content, io);
    }

    static async createForShopReview(shop, io) {
        const name = shop?.name ?? 'Dükan';
        const content = `"${name}" dükanyny barlamak üçin ugradyldy`;
        return this._broadcastToAdmins(STATUSES.NOT_SHOP_REVIEW, shop?.id ?? shop, content, io);
    }

    static async createForReview(review, io) {
        const content = `Täze teswir geldi (#${review?.id ?? review})`;
        return this._broadcastToAdmins(STATUSES.NOT_REVIEW, review?.id ?? review, content, io);
    }

    static async createForDispute(dispute, io) {
        const content = `Täze jedel açyldy (#${dispute?.id ?? dispute})`;
        return this._broadcastToAdmins(STATUSES.NOT_DISPUTE, dispute?.id ?? dispute, content, io);
    }

    static async createForShopRejected(shop, note, io) {
        const content = { message: note || 'Dükan arzaňyz ret edildi.' };
        const record = await this.create({
            userId:   shop.owner_id,
            type:     STATUSES.NOT_SHOP_REJECTED,
            targetId: shop.id,
            content,
        });
        if (io) io.to(shop.owner_id).emit('notification', record);
        return record;
    }

    static async createForShopApproved(shop, io) {
        const name = shop?.name ?? 'Dükan';
        const content = { message: `"${name}" dükanyňyz tassyklandy! Indi söwda edip bilersiňiz.` };
        const record = await this.create({
            userId:   shop.owner_id,
            type:     STATUSES.NOT_SHOP_APPROVED,
            targetId: shop.id,
            content,
        });
        if (io) io.to(shop.owner_id).emit('notification', record);
        return record;
    }
}

module.exports = NotificationService;
