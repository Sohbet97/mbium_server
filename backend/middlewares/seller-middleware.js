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
            { model: db.Plan, as: 'plan', attributes: ['id', 'name', 'commission_rate', 'product_limit', 'ai_credits_monthly', 'auction_per_week', 'live_stream_mode', 'verified_badge', 'push_notif_monthly', 'reel_monthly'], required: false },
            { model: db.ShopType, as: 'type', attributes: ['id', 'name'], required: false },
        ];

        const where = { owner_id: req.user.id, is_active: true };
        if (requestedId) where.id = requestedId;

        const shop = await db.Shop.findOne({ where, include });

        if (!shop) {
            // Distinguish "no such shop / not yours" from "shop exists but isn't active yet",
            // so the client can tell a real permission error apart from a pending-approval state.
            const ownedWhere = requestedId
                ? { id: requestedId, owner_id: req.user.id }
                : { owner_id: req.user.id };
            const ownedShop = await db.Shop.findOne({ where: ownedWhere, attributes: ['id', 'is_active'] });

            if (ownedShop) {
                throw ApiError.NotAllowed('Aktiwleşdirilen dükaňyz ýok', 'SHOP_NOT_ACTIVE');
            }
            throw ApiError.NotAllowed('Dükan tapylmady', 'SHOP_NOT_FOUND');
        }

        req.shop = shop;
        next();
    } catch (e) {
        next(e);
    }
};
