const PurchaseService = require("../services/PurchaseService");

class WalletController {
    static async getMyTransactions(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const skip = parseInt(req.query.skip) || 0;
            const filter = { user_id: req.user.id };
            if (req.query.shop_id) filter.shop_id = req.query.shop_id;
            if (req.query.feature) filter.feature = req.query.feature;
            const result = await PurchaseService.getTransactions(filter, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }
}

module.exports = WalletController;
