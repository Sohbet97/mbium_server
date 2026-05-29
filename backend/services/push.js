const db = require('../models')
const { sendMulticastNotification } = require('../utils/firebase')

// Silently no-ops when Firebase is not configured or user has no tokens.
// Never throws — always wrap callers in .catch(() => {}).

async function _tokensFor(userId) {
    if (!userId) return []
    const user = await db.User.findByPk(userId, { attributes: ['device_tokens'] })
    const tokens = user?.device_tokens
    return Array.isArray(tokens) ? tokens.filter(Boolean) : []
}

async function _tokensForShopOwner(shopId) {
    if (!shopId) return []
    const shop = await db.Shop.findByPk(shopId, { attributes: ['owner_id'] })
    return shop?.owner_id ? _tokensFor(shop.owner_id) : []
}

async function _send(tokens, title, body, data = {}) {
    if (!tokens.length) return
    try {
        await sendMulticastNotification(tokens, { title, body }, data)
    } catch (err) {
        // Firebase not configured or network failure — log and continue
        console.warn('[PushService] send failed:', err.message)
    }
}

// ── Public helpers ─────────────────────────────────────────────────────────────

async function notifyUser(userId, title, body, data = {}) {
    const tokens = await _tokensFor(userId)
    return _send(tokens, title, body, data)
}

async function notifyShopOwner(shopId, title, body, data = {}) {
    const tokens = await _tokensForShopOwner(shopId)
    return _send(tokens, title, body, data)
}

// ── Order events ───────────────────────────────────────────────────────────────

const ORDER_STATUS_LABELS = {
    0:  'Kabul edildi',
    1:  'Tassyklandy',
    2:  'Taýýarlanýar',
    3:  'Ýola çykdy',
    4:  'Gowşuryldy',
    5:  'Tamamlandy',
    10: 'Ýatyryldy',
    11: 'Yzyna gaýtaryldy',
}

async function onOrderCreated(order) {
    // Notify the shop owner (seller) of a new order
    return notifyShopOwner(
        order.shop_id,
        'Täze sargyt geldi 🛒',
        `Sargyt #${order.id} — ${Number(order.total_price).toFixed(2)} TMT`,
        { type: 'ORDER_NEW', order_id: String(order.id) },
    )
}

async function onOrderStatusChanged(orderId, buyerId, shopId, status) {
    const label = ORDER_STATUS_LABELS[status] ?? `Status: ${status}`
    const tasks = []

    // Always notify the buyer
    tasks.push(
        notifyUser(
            buyerId,
            `Sargyt #${orderId} — ${label}`,
            'Sargytyňyzyň ýagdaýy täzelendi.',
            { type: 'ORDER_STATUS', order_id: String(orderId), status: String(status) },
        )
    )

    // Also notify seller when order is cancelled or refunded
    if (status === 10 || status === 11) {
        tasks.push(
            notifyShopOwner(
                shopId,
                `Sargyt #${orderId} — ${label}`,
                'Alyjy sargydy ýatyrdy.',
                { type: 'ORDER_STATUS', order_id: String(orderId), status: String(status) },
            )
        )
    }

    return Promise.all(tasks)
}

// ── Shop events ────────────────────────────────────────────────────────────────

async function onShopVerified(shop) {
    return notifyUser(
        shop.owner_id,
        'Dükanňyz tassyklandy ✅',
        `"${shop.name}" dükanyňyz işe taýýar!`,
        { type: 'SHOP_VERIFIED', shop_id: String(shop.id) },
    )
}

async function onShopRejected(shop, note) {
    return notifyUser(
        shop.owner_id,
        'Dükan arzaňyz ret edildi',
        note || 'Goşmaça maglumat üçin admin bilen habarlaşyň.',
        { type: 'SHOP_REJECTED', shop_id: String(shop.id) },
    )
}

module.exports = { notifyUser, notifyShopOwner, onOrderCreated, onOrderStatusChanged, onShopVerified, onShopRejected }
