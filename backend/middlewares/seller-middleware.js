const db = require('../models');
const ApiError = require('../exceptions/api-error');

/**
 * Verifies that the authenticated user owns an active, approved shop.
 * Attaches req.shop so seller controllers don't need to re-fetch it.
 */
module.exports = async (req, res, next) => {
    try {
        const shop = await db.Shop.findOne({
            where: { owner_id: req.user.id, is_active: true },
            include: [
                { model: db.Plan, as: 'plan', attributes: ['id', 'name', 'commission_rate', 'product_limit', 'ai_credits_monthly', 'auction_per_week', 'live_stream_mode', 'verified_badge'], required: false },
                { model: db.ShopType, as: 'type', attributes: ['id', 'name'], required: false },
            ],
        });

        if (!shop) {
            throw ApiError.NotAllowed('Aktiwleşdirilen dükaňyz ýok');
        }

        req.shop = shop;
        next();
    } catch (e) {
        next(e);
    }
};
