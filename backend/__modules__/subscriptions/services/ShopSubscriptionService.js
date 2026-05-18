const db = require("../../../models");

class ShopSubscriptionService {
    static async getAll({ shop_id, status } = {}, limit, offset = 0) {
        const where = {};
        if (shop_id !== undefined) where.shop_id = shop_id;
        if (status  !== undefined) where.status  = status;
        return db.ShopSubscription.findAll({
            where,
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                { model: db.Plan, as: "plan", attributes: ["id", "name", "display_name_tm", "display_name_ru", "display_name_en", "price_monthly"] },
                { model: db.Shop, as: "shop", attributes: ["id", "name"] },
            ],
        });
    }

    static async getCount(filter = {}) {
        return db.ShopSubscription.count({ where: filter });
    }

    static async getActiveForShop(shop_id) {
        return db.ShopSubscription.findOne({
            where: { shop_id, status: 1 },
            order: [["createdAt", "DESC"]],
            include: [{ model: db.Plan, as: "plan" }],
        });
    }

    static async assign({ shop_id, plan_id, starts_at, ends_at, note, assigned_by }) {
        // Cancel any current active subscription for this shop
        await db.ShopSubscription.update(
            { status: 2 },
            { where: { shop_id, status: 1 } }
        );

        const sub = await db.ShopSubscription.create({
            shop_id,
            plan_id,
            status: 1,
            starts_at: starts_at ?? new Date(),
            ends_at: ends_at ?? null,
            note:    note    ?? null,
            assigned_by: assigned_by ?? null,
        });

        // Update shop.plan_id for fast lookup
        await db.Shop.update({ plan_id }, { where: { id: shop_id } });

        return sub;
    }

    static async updateStatus(id, status, note) {
        const sub = await db.ShopSubscription.findOne({ where: { id } });
        if (!sub) return null;

        await sub.update({ status, ...(note ? { note } : {}) });

        // If cancelling/expiring the active subscription, clear shop.plan_id
        if ([2, 3].includes(status) && sub.status === 1) {
            await db.Shop.update({ plan_id: null }, { where: { id: sub.shop_id } });
        }

        return sub;
    }

    static async remove(id) {
        const sub = await db.ShopSubscription.findOne({ where: { id } });
        if (!sub) return 0;
        if (sub.status === 1) {
            await db.Shop.update({ plan_id: null }, { where: { id: sub.shop_id } });
        }
        return db.ShopSubscription.destroy({ where: { id } });
    }
}

module.exports = ShopSubscriptionService;
