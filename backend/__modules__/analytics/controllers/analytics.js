const AnalyticsService = require('../services/analytics');

class AnalyticsController {
    static async getOverview(req, res, next) {
        try {
            const { date_from, date_to, period } = req.query;
            const data = await AnalyticsService.getOverview({ date_from, date_to, period });
            return res.status(200).json(data);
        } catch (e) { next(e); }
    }

    static async getShops(req, res, next) {
        try {
            const { date_from, date_to, limit } = req.query;
            const data = await AnalyticsService.getShops({ date_from, date_to, limit });
            return res.status(200).json(data);
        } catch (e) { next(e); }
    }

    static async getUsers(req, res, next) {
        try {
            const { date_from, date_to, period } = req.query;
            const data = await AnalyticsService.getUsers({ date_from, date_to, period });
            return res.status(200).json(data);
        } catch (e) { next(e); }
    }

    static async getOrders(req, res, next) {
        try {
            const { date_from, date_to } = req.query;
            const data = await AnalyticsService.getOrders({ date_from, date_to });
            return res.status(200).json(data);
        } catch (e) { next(e); }
    }
}

module.exports = AnalyticsController;
