const ApiError = require('../exceptions/api-error');
const { FUNCTIONS } = require('../utils/functions');
const NotificationService = require('../services/notifications');

class NotificationController {
    static async get(req, res, next) {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const filter = { user_id: req.user?.id };
            if (req.query.status !== undefined) filter.status = Number(req.query.status);
            const [data, count] = await Promise.all([
                NotificationService.get(filter, limit, skip),
                NotificationService.getCount(filter),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getUnreadCount(req, res, next) {
        try {
            const count = await NotificationService.getCount({
                user_id: req.user?.id,
                status: 0,
            });
            return res.status(200).json({ count });
        } catch (e) { next(e); }
    }

    static async markAsRead(req, res, next) {
        try {
            const model = await NotificationService.getById(req.params.id);
            if (!model) throw ApiError.NotFound('Bildiriş tapylmady');
            if (model.user_id !== req.user?.id) throw ApiError.NotAllowed();
            await NotificationService.markAsRead(req.params.id);
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async markAllAsRead(req, res, next) {
        try {
            await NotificationService.markAllAsRead(req.user?.id);
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }
}

module.exports = NotificationController;
