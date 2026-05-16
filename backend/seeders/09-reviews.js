/**
 * Seeder: product reviews for all delivered orders placed by test customers.
 * Idempotent — skips if any reviews already exist.
 *
 * Depends on: 07-users, 08-orders
 */

const REVIEW_BY_PHONE = {
    '61100001': { rating: 5, comment: 'Örän gowy önüm, hili ýokary. Tiz eltip berdiler, minnetdar!' },
    '61100002': { rating: 4, comment: 'Önüm gowy, ýöne gaplama gowulandyrylyp biler. Maslahat berýärin.' },
    '61100003': { rating: 5, comment: 'Ajaýyp hil, sergide görüşimden has gowy. Örän kanagatlandyryjy!' },
    '61100004': { rating: 3, comment: 'Ortaça önüm. Bellenilen wagtynda geldi, ýöne hilinde kem-käslikler bar.' },
    '61100005': { rating: 4, comment: 'Umumy alyş-satlyş kanagatlandyryjy, indekide hem satyn alaryn.' },
};

module.exports = async (db) => {
    console.log('  Checking existing reviews…');

    const existing = await db.Review.count();
    if (existing > 0) {
        console.log(`  Skipping: ${existing} reviews already exist`);
        return;
    }

    const customerPhones = Object.keys(REVIEW_BY_PHONE);
    const [userRows] = await db.sequelize.query(
        `SELECT id, phone_number FROM users WHERE phone_number IN (:phones) AND "deletedAt" IS NULL`,
        { replacements: { phones: customerPhones } }
    );

    if (!userRows.length) {
        console.log('  Skipping: no customer users found');
        return;
    }

    const userIds = userRows.map(u => u.id);
    const phoneByUserId = Object.fromEntries(userRows.map(u => [u.id, u.phone_number]));

    // Load delivered orders with their items
    const deliveredOrders = await db.Order.findAll({
        where: { user_id: userIds, status: 4 },
        include: [{ model: db.OrderItem, as: 'items' }],
    });

    if (!deliveredOrders.length) {
        console.log('  Skipping: no delivered orders found');
        return;
    }

    const rows = [];
    for (const order of deliveredOrders) {
        const phone = phoneByUserId[order.user_id];
        const rev = REVIEW_BY_PHONE[phone] ?? { rating: 4, comment: 'Gowy önüm, maslahat berýärin.' };

        for (const item of order.items) {
            rows.push({
                user_id: order.user_id,
                product_id: item.product_id,
                order_id: order.id,
                rating: rev.rating,
                comment: rev.comment,
                status: 1, // approved
            });
        }
    }

    if (!rows.length) {
        console.log('  Skipping: no items to review');
        return;
    }

    await db.Review.bulkCreate(rows, { ignoreDuplicates: true });
    console.log(`  Done: ${rows.length} review(s) created`);
};
