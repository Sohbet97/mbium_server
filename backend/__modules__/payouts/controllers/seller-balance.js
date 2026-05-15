const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const PayoutService = require("../services/payouts");

class SellerBalanceController {
    static async get(req, res, next) {
        try {
            const filter = PayoutService.getBalanceFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                PayoutService.getBalances(filter, limit, skip),
                PayoutService.getBalancesCount(filter),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getByShop(req, res, next) {
        try {
            const model = await PayoutService.getBalanceByShop(req.params.shopId);
            if (!model) throw ApiError.NotFound("Balans tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }
}

module.exports = SellerBalanceController;
