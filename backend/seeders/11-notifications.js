/**
 * Seeder: admin notifications covering all four marketplace event types.
 * Idempotent — skips if any notifications already exist.
 *
 * Types:
 *   100 (NOT_ORDER)       — new order placed
 *   110 (NOT_SHOP_REVIEW) — shop submitted for verification
 *   120 (NOT_REVIEW)      — new product review posted
 *   130 (NOT_DISPUTE)     — new dispute opened
 *
 * Depends on: 00-superadmin, 08-orders, 06-shops, 09-reviews
 */

const NOT_ORDER       = 100;
const NOT_SHOP_REVIEW = 110;
const NOT_REVIEW      = 120;
const NOT_DISPUTE     = 130;

module.exports = async (db) => {
    console.log('  Checking existing notifications…');

    const existing = await db.Notification.count();
    if (existing > 0) {
        console.log(`  Skipping: ${existing} notifications already exist`);
        return;
    }

    // Target the superadmin (and any other admin users with roles)
    const [adminRows] = await db.sequelize.query(
        `SELECT id FROM users WHERE "deletedAt" IS NULL AND role_id IS NOT NULL ORDER BY "createdAt" ASC`
    );
    if (!adminRows.length) {
        console.log('  Skipping: no admin users found');
        return;
    }
    const adminIds = adminRows.map(u => u.id);

    // Gather target IDs from seeded data
    const [orderRows] = await db.sequelize.query(
        `SELECT id FROM orders WHERE "deletedAt" IS NULL ORDER BY id ASC LIMIT 5`
    );
    const [shopRows] = await db.sequelize.query(
        `SELECT id, name FROM shops WHERE "deletedAt" IS NULL ORDER BY id ASC LIMIT 3`
    );
    const [reviewRows] = await db.sequelize.query(
        `SELECT id FROM reviews WHERE "deletedAt" IS NULL ORDER BY id ASC LIMIT 4`
    );

    const now = new Date();
    const ago = (minutes) => new Date(now - minutes * 60_000);

    // Build one set of notifications per admin user
    const rows = [];
    for (const adminId of adminIds) {
        // Order notifications — mix of read and unread
        for (let i = 0; i < orderRows.length; i++) {
            const isRead = i < 2; // first two are read
            rows.push({
                user_id:   adminId,
                type:      NOT_ORDER,
                target_id: String(orderRows[i].id),
                content:   `Täze sargyt #${orderRows[i].id} geldi`,
                status:    isRead ? 1 : 0,
                read_at:   isRead ? ago(30 + i * 10) : null,
                createdAt: ago(60 + i * 15),
                updatedAt: ago(60 + i * 15),
            });
        }

        // Shop review notifications — all unread
        for (const shop of shopRows) {
            rows.push({
                user_id:   adminId,
                type:      NOT_SHOP_REVIEW,
                target_id: String(shop.id),
                content:   `"${shop.name}" dükany barlag üçin iberildi`,
                status:    0,
                read_at:   null,
                createdAt: ago(45),
                updatedAt: ago(45),
            });
        }

        // Review notifications — first one read, rest unread
        for (let i = 0; i < reviewRows.length; i++) {
            const isRead = i === 0;
            rows.push({
                user_id:   adminId,
                type:      NOT_REVIEW,
                target_id: String(reviewRows[i].id),
                content:   `Täze synlama #${reviewRows[i].id} goşuldy`,
                status:    isRead ? 1 : 0,
                read_at:   isRead ? ago(120) : null,
                createdAt: ago(180 + i * 20),
                updatedAt: ago(180 + i * 20),
            });
        }

        // Dispute notifications — unread (most urgent)
        if (orderRows.length >= 2) {
            rows.push({
                user_id:   adminId,
                type:      NOT_DISPUTE,
                target_id: String(orderRows[0].id),
                content:   `Sargyt #${orderRows[0].id} boýunça jedel açyldy`,
                status:    0,
                read_at:   null,
                createdAt: ago(10),
                updatedAt: ago(10),
            });
            rows.push({
                user_id:   adminId,
                type:      NOT_DISPUTE,
                target_id: String(orderRows[1].id),
                content:   `Sargyt #${orderRows[1].id} boýunça jedel açyldy`,
                status:    1,
                read_at:   ago(200),
                createdAt: ago(240),
                updatedAt: ago(200),
            });
        }
    }

    if (!rows.length) {
        console.log('  Skipping: no target data found (run orders/shops/reviews seeders first)');
        return;
    }

    await db.Notification.bulkCreate(rows);

    const unread = rows.filter(r => r.status === 0).length;
    const read   = rows.filter(r => r.status === 1).length;
    console.log(`  Done: ${rows.length} notification(s) created (${unread} unread, ${read} read)`);
};
