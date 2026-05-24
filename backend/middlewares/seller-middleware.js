const db = require('../models');
const ApiError = require('../exceptions/api-error');

/**
 * Verifies that the authenticated user owns an active, approved shop.
 * Attaches req.shop so seller controllers don't need to re-fetch it.
 */
module.exports = async (req, res, next) => {
    try {
        const requestedId = req.headers['x-shop-id'];
        const include = [
            { model: db.Plan, as: 'plan', attributes: ['id', 'name', 'commission_rate', 'product_limit', 'ai_credits_monthly', 'auction_per_week', 'live_stream_mode', 'verified_badge', 'push_notif_monthly'], required: false },
            { model: db.ShopType, as: 'type', attributes: ['id', 'name'], required: false },
        ];

        let shop = null;

        if (requestedId) {
            shop = await db.Shop.findOne({
                where: { id: requestedId, owner_id: req.user.id, is_active: true },
                include,
            });
        }

        if (!shop) {
            shop = await db.Shop.findOne({
                where: { owner_id: req.user.id, is_active: true },
                include,
            });
        }

        if (!shop) {
            throw ApiError.NotAllowed('Aktiwleşdirilen dükaňyz ýok');
        }

        req.shop = shop;
        next();
    } catch (e) {
        next(e);
    }
};
