const db = require("../../../models");

class PayoutService {
    // ——— SellerBalance ———

    static async getBalances(filter = {}, limit, skip = 0) {
        return db.SellerBalance.findAll({
            where: filter,
            offset: skip,
            limit,
            order: [["createdAt", "DESC"]],
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
            ],
        });
    }

    static async getBalancesCount(filter = {}) {
        return db.SellerBalance.count({ where: filter });
    }

    static async getBalanceByShop(shopId) {
        if (!shopId) return null;
        return db.SellerBalance.findOne({
            where: { shop_id: shopId },
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
            ],
        });
    }

    static async getOrCreateBalance(shopId) {
        const [model] = await db.SellerBalance.findOrCreate({
            where: { shop_id: shopId },
            defaults: { shop_id: shopId, balance: 0, currency: "TMT" },
        });
        return model;
    }

    static async creditBalance(shopId, amount) {
        const balance = await this.getOrCreateBalance(shopId);
        return balance.increment("balance", { by: parseFloat(amount) });
    }

    static async debitBalance(shopId, amount) {
        const balance = await this.getOrCreateBalance(shopId);
        return balance.decrement("balance", { by: parseFloat(amount) });
    }

    static getBalanceFilter({ shop_id } = {}) {
        const filter = {};
        if (shop_id !== undefined) filter.shop_id = shop_id;
        return filter;
    }

    // ——— PayoutRequest ———

    static async getRequests(filter = {}, limit, skip = 0, paranoid = true) {
        return db.PayoutRequest.findAll({
            where: filter,
            offset: skip,
            limit,
            paranoid,
            order: [["createdAt", "DESC"]],
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
                { model: db.User, as: "requester", attributes: ["id", "name", "surname"], required: false },
                { model: db.User, as: "processor", attributes: ["id", "name", "surname"], required: false },
            ],
        });
    }

    static async getRequestsCount(filter = {}, paranoid = true) {
        return db.PayoutRequest.count({ where: filter, paranoid });
    }

    static async getRequestById(id, paranoid = true) {
        if (!id) return null;
        return db.PayoutRequest.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
                { model: db.User, as: "requester", attributes: ["id", "name", "surname"], required: false },
                { model: db.User, as: "processor", attributes: ["id", "name", "surname"], required: false },
            ],
        });
    }

    static async createRequest(body) {
        return db.PayoutRequest.create(body);
    }

    static async updateRequest(id, body) {
        await db.PayoutRequest.update(body, { where: { id } });
        return this.getRequestById(id);
    }

    static async deleteRequest(id, force = false) {
        return db.PayoutRequest.destroy({ where: { id }, force });
    }

    static async restoreRequest(id) {
        return db.PayoutRequest.restore({ where: { id } });
    }

    static getRequestFilter({ shop_id, status } = {}) {
        const filter = {};
        if (shop_id !== undefined) filter.shop_id = shop_id;
        if (status) filter.status = status;
        return filter;
    }
}

module.exports = PayoutService;
