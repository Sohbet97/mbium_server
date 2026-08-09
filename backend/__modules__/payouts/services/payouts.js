const { Op } = require("sequelize");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");
const { SELLER_TRANSACTION_TYPES, SELLER_TRANSACTION_STATUSES } = require("../models/SellerTransaction.model");

const HOLD_HOURS = 24;

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
            defaults: { shop_id: shopId, available_balance: 0, pending_balance: 0, currency: "TMT" },
        });
        return model;
    }

    static async debitBalance(shopId, amount) {
        const balance = await this.getOrCreateBalance(shopId);
        return balance.decrement("available_balance", { by: parseFloat(amount) });
    }

    // ——— SellerTransaction ledger ———

    // Credits the seller for a closed order, net of commission, into a 24h hold
    // (pending_balance) before it becomes withdrawable — mirrors how card processors
    // hold funds until a return window passes.
    static async creditOrderPending(shopId, orderId, grossAmount, commissionAmount, sellerAmount) {
        // Idempotency guard: an order can be moved to DELIVERED more than once
        // (retry, status bounced back and forth) — never credit the same order twice.
        const already = await db.SellerTransaction.findOne({
            where: { order_id: orderId, type: SELLER_TRANSACTION_TYPES.ORDER_CREDIT },
        });
        if (already) return this.getOrCreateBalance(shopId);

        const balance = await this.getOrCreateBalance(shopId);
        const availableAt = new Date(Date.now() + HOLD_HOURS * 60 * 60 * 1000);

        if (commissionAmount > 0) {
            await db.SellerTransaction.create({
                shop_id: shopId,
                type: SELLER_TRANSACTION_TYPES.COMMISSION,
                amount: -commissionAmount,
                status: SELLER_TRANSACTION_STATUSES.AVAILABLE,
                order_id: orderId,
                note: `Mbium komissiýasy - Sargyt #${orderId}`,
            });
        }

        await balance.increment("pending_balance", { by: sellerAmount });
        await balance.reload();

        await db.SellerTransaction.create({
            shop_id: shopId,
            type: SELLER_TRANSACTION_TYPES.ORDER_CREDIT,
            amount: sellerAmount,
            status: SELLER_TRANSACTION_STATUSES.PENDING,
            available_at: availableAt,
            order_id: orderId,
            balance_after: balance.pending_balance,
            note: `Sargyt #${orderId}`,
        });

        return balance;
    }

    // Reverses an order's credit on cancel/refund — whether it's still on hold (PENDING,
    // decrement pending_balance) or already released (AVAILABLE, decrement available_balance,
    // which can go negative if it was already paid out — an acceptable, auditable debt).
    static async reverseOrderCredit(orderId) {
        const alreadyReversed = await db.SellerTransaction.findOne({
            where: { order_id: orderId, type: SELLER_TRANSACTION_TYPES.PAYOUT_REVERSAL },
        });
        if (alreadyReversed) return null;

        const entry = await db.SellerTransaction.findOne({
            where: { order_id: orderId, type: SELLER_TRANSACTION_TYPES.ORDER_CREDIT },
            order: [["createdAt", "DESC"]],
        });
        if (!entry) return null;

        const balance = await this.getOrCreateBalance(entry.shop_id);
        const amount = parseFloat(entry.amount);

        if (entry.status === SELLER_TRANSACTION_STATUSES.PENDING) {
            await balance.decrement("pending_balance", { by: amount });
            await entry.destroy();
        } else {
            await balance.decrement("available_balance", { by: amount });
        }

        return db.SellerTransaction.create({
            shop_id: entry.shop_id,
            type: SELLER_TRANSACTION_TYPES.PAYOUT_REVERSAL,
            amount: -amount,
            status: SELLER_TRANSACTION_STATUSES.AVAILABLE,
            order_id: orderId,
            note: `Sargyt #${orderId} ýatyryldy - tutulan serişde yzyna alyndy`,
        });
    }

    // Moves due (available_at <= now) pending order credits into available balance.
    // Called periodically by the release-pending-balances cron job.
    static async releaseDueHolds() {
        const due = await db.SellerTransaction.findAll({
            where: {
                type: SELLER_TRANSACTION_TYPES.ORDER_CREDIT,
                status: SELLER_TRANSACTION_STATUSES.PENDING,
                available_at: { [Op.lte]: new Date() },
            },
        });

        for (const entry of due) {
            const balance = await this.getOrCreateBalance(entry.shop_id);
            await balance.decrement("pending_balance", { by: parseFloat(entry.amount) });
            await balance.increment("available_balance", { by: parseFloat(entry.amount) });
            await entry.update({ status: SELLER_TRANSACTION_STATUSES.AVAILABLE });
        }

        return due.length;
    }

    // Debits available balance and writes a PAYOUT_DEBIT ledger row when a payout is processed.
    // The decrement is conditioned on available_balance >= amount in the WHERE clause, so it's
    // atomic at the DB level — closes both the double-process race and the multi-request overdraft.
    static async debitForPayout(payoutRequest) {
        const amount = parseFloat(payoutRequest.amount);
        const [affected] = await db.SellerBalance.update(
            { available_balance: db.sequelize.literal(`available_balance - ${amount}`) },
            { where: { shop_id: payoutRequest.shop_id, available_balance: { [Op.gte]: amount } } }
        );
        if (!affected) throw ApiError.BadRequest("Balans ýeterlik däl");

        const balance = await this.getBalanceByShop(payoutRequest.shop_id);
        await db.SellerTransaction.create({
            shop_id: payoutRequest.shop_id,
            type: SELLER_TRANSACTION_TYPES.PAYOUT_DEBIT,
            amount: -parseFloat(payoutRequest.amount),
            status: SELLER_TRANSACTION_STATUSES.AVAILABLE,
            payout_request_id: payoutRequest.id,
            balance_after: balance.available_balance,
            note: `Pul geçirimi - #${payoutRequest.id}`,
        });
        return balance;
    }

    static async getTransactions(shopId, limit, skip = 0) {
        return db.SellerTransaction.findAll({
            where: { shop_id: shopId },
            offset: skip,
            limit,
            order: [["createdAt", "DESC"]],
        });
    }

    static async getTransactionsCount(shopId) {
        return db.SellerTransaction.count({ where: { shop_id: shopId } });
    }

    // Today / this-week / this-month order-credit stats for the seller dashboard
    static async getStats(shopId) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const ranges = { today: startOfDay, week: startOfWeek, month: startOfMonth };
        const result = {};

        for (const [key, from] of Object.entries(ranges)) {
            const rows = await db.SellerTransaction.findAll({
                where: {
                    shop_id: shopId,
                    type: SELLER_TRANSACTION_TYPES.ORDER_CREDIT,
                    createdAt: { [Op.gte]: from },
                },
                attributes: ["amount", "order_id"],
            });
            result[key] = {
                amount: rows.reduce((sum, r) => sum + parseFloat(r.amount), 0),
                orders: new Set(rows.map((r) => r.order_id)).size,
            };
        }

        return result;
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

    // Sum of PENDING + APPROVED requests not yet processed — funds already spoken for
    static async getReservedAmount(shopId) {
        const rows = await db.PayoutRequest.findAll({
            where: { shop_id: shopId, status: { [Op.in]: ["PENDING", "APPROVED"] } },
            attributes: ["amount"],
        });
        return rows.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    }

    static getRequestFilter({ shop_id, status } = {}) {
        const filter = {};
        if (shop_id !== undefined) filter.shop_id = shop_id;
        if (status) filter.status = status;
        return filter;
    }
}

module.exports = PayoutService;
