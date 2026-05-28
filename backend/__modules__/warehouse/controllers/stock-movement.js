const { FUNCTIONS } = require("../../../utils/functions");
const StockMovementService = require("../services/stock-movement");

class StockMovementController {
    static async get(req, res, next) {
        try {
            const filter = StockMovementService.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                StockMovementService.get(filter, limit, skip),
                StockMovementService.getCount(filter),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }
}

module.exports = StockMovementController;
