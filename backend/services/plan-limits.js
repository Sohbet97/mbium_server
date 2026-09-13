const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../exceptions/api-error');

const LABELS = {
    push_notif_monthly: 'Push notifications',
    reel_monthly: 'Reels',
};

function _startOfMonth() {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Counts this shop's usage of a quota-gated resource for the current calendar month.
async function getMonthlyUsage(shopId, key) {
    const start = _startOfMonth();
    if (key === 'push_notif_monthly') {
        return db.PushNotificationCampaign.count({
            where: { shop_id: shopId, status: 1, createdAt: { [Op.gte]: start } },
        });
    }
    if (key === 'reel_monthly') {
        return db.Reel.count({ where: { shop_id: shopId, createdAt: { [Op.gte]: start } } });
    }
    throw new Error(`Unknown quota key: ${key}`);
}

// plan[key]: null = unlimited, 0 = not available on this plan, N = monthly cap.
// No plan at all is treated the same as quota 0.
function assertQuota(plan, key, usedCount) {
    const label = LABELS[key] || key;
    if (!plan) throw ApiError.Forbidden(`${label} not available on your plan`);

    const quota = plan[key];
    if (quota === null) return;
    if (quota === 0) throw ApiError.Forbidden(`${label} not available on your plan`);
    if (usedCount >= quota) throw ApiError.Forbidden(`Monthly ${label.toLowerCase()} limit reached (${quota})`);
}

async function getUsage(shop, key) {
    const quota = shop?.plan ? shop.plan[key] : 0;
    const used = await getMonthlyUsage(shop.id, key);
    return { used, quota };
}

module.exports = { assertQuota, getUsage, getMonthlyUsage };
