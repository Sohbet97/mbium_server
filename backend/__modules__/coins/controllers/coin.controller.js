const CoinService = require("../services/CoinService");

class CoinController {

    // ─── Admin: Balances ──────────────────────────────────────────────────────

    static async getBalances(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const skip  = parseInt(req.query.skip)  || 0;
            const result = await CoinService.getBalances({}, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }

    static async getBalanceByUser(req, res, next) {
        try {
            const { userId } = req.params;
            const balance = await CoinService.getBalance(userId);
            const history = await CoinService.getHistory(userId, 50, 0);
            res.json({ balance, history: history.rows, count: history.count });
        } catch (e) { next(e); }
    }

    // ─── Admin: Grant / Deduct ────────────────────────────────────────────────

    static async grant(req, res, next) {
        try {
            const { user_ids, amount, note } = req.body;
            if (!user_ids?.length || !amount) return res.status(400).json({ message: "user_ids and amount required" });
            await CoinService.adminGrant(user_ids, parseInt(amount), note, req.user?.id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }

    static async deduct(req, res, next) {
        try {
            const { user_id, amount, note } = req.body;
            if (!user_id || !amount) return res.status(400).json({ message: "user_id and amount required" });
            await CoinService.debit(user_id, parseInt(amount), "MANUAL", null, note, req.user?.id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }

    // ─── Admin: Conditions ────────────────────────────────────────────────────

    static async getConditions(req, res, next) {
        try {
            const data = await CoinService.getConditions();
            res.json({ data });
        } catch (e) { next(e); }
    }

    static async createCondition(req, res, next) {
        try {
            const item = await CoinService.createCondition(req.body);
            res.status(201).json(item);
        } catch (e) { next(e); }
    }

    static async updateCondition(req, res, next) {
        try {
            const item = await CoinService.updateCondition(req.params.id, req.body);
            res.json(item);
        } catch (e) { next(e); }
    }

    static async deleteCondition(req, res, next) {
        try {
            await CoinService.deleteCondition(req.params.id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }

    // ─── Admin: Topups ────────────────────────────────────────────────────────

    static async getTopups(req, res, next) {
        try {
            const limit  = parseInt(req.query.limit)  || 20;
            const skip   = parseInt(req.query.skip)   || 0;
            const filter = {};
            if (req.query.status) filter.status = req.query.status;
            const result = await CoinService.getTopups(filter, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }

    static async processTopup(req, res, next) {
        try {
            const { status, note } = req.body;
            if (!["APPROVED", "REJECTED"].includes(status))
                return res.status(400).json({ message: "status must be APPROVED or REJECTED" });
            const topup = await CoinService.processTopup(req.params.id, status, note, req.user?.id);
            res.json(topup);
        } catch (e) { next(e); }
    }

    // ─── Buyer ────────────────────────────────────────────────────────────────

    static async getMyBalance(req, res, next) {
        try {
            const balance = await CoinService.getBalance(req.user.id);
            res.json(balance ?? { balance: 0, total_earned: 0, total_spent: 0 });
        } catch (e) { next(e); }
    }

    static async getMyHistory(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const skip  = parseInt(req.query.skip)  || 0;
            const result = await CoinService.getHistory(req.user.id, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }

    static async submitTopup(req, res, next) {
        try {
            const { amount_tmt, receipt_url } = req.body;
            if (!amount_tmt) return res.status(400).json({ message: "amount_tmt required" });
            const topup = await CoinService.createTopup(req.user.id, amount_tmt, receipt_url);
            res.status(201).json(topup);
        } catch (e) { next(e); }
    }

    static async getMyTopups(req, res, next) {
        try {
            const limit  = parseInt(req.query.limit) || 20;
            const skip   = parseInt(req.query.skip)  || 0;
            const result = await CoinService.getTopups({ user_id: req.user.id }, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }
}

module.exports = CoinController;
