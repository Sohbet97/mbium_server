/**
 * Seeder: 10 test orders (mix of statuses) for 5 customer users.
 * Idempotent — skips if any orders already exist.
 *
 * Depends on: 07-users, 06-shops, 02-products
 */

// status codes: 0=PENDING 1=CONFIRMED 2=PROCESSING 3=SHIPPED 4=DELIVERED 10=CANCELLED
const ORDERS = [
    {
        userPhone: '61100001', shopName: 'TeknoMart', status: 4,
        address: 'Magtymguly şaýoly 12, Aşgabat',
        items: [
            { sku: 'SGA54-128', name: 'Samsung Galaxy A54',    qty: 1, price: 1590.00 },
        ],
    },
    {
        userPhone: '61100002', shopName: 'TeknoMart', status: 4,
        address: 'Bitarap Türkmenistan şaýoly 34, Aşgabat',
        items: [
            { sku: 'SWH1KXM5', name: 'Sony WH-1000XM5',        qty: 1, price: 1250.00 },
            { sku: 'XRN13-128', name: 'Xiaomi Redmi Note 13',  qty: 1, price:  990.00 },
        ],
    },
    {
        userPhone: '61100003', shopName: 'Moda Bazary', status: 4,
        address: 'Garaşsyzlyk köçesi 7, Aşgabat',
        items: [
            { sku: 'MJ-SLIM-BL', name: 'Erkek slim jinsjalbar', qty: 2, price: 280.00 },
            { sku: 'MP-POLO-01', name: 'Erkek polo köýnek',     qty: 1, price: 145.00 },
        ],
    },
    {
        userPhone: '61100004', shopName: 'Güneş Market', status: 3,
        address: 'Oguzhan köçesi 19, Aşgabat',
        items: [
            { sku: 'KB-1000W', name: 'Aşhana blenderi',   qty: 1, price: 185.00 },
            { sku: 'EK-17L',   name: 'Çaýnik elektrik',   qty: 1, price:  95.00 },
        ],
    },
    {
        userPhone: '61100005', shopName: 'Sport Dünýäsi', status: 1,
        address: 'Arçabil şaýoly 56, Aşgabat',
        items: [
            { sku: 'NAM270',   name: 'Nike Air Max 270', qty: 1, price: 450.00 },
            { sku: 'FB-SMART', name: 'Fitnes guşagy',    qty: 1, price: 175.00 },
        ],
    },
    {
        userPhone: '61100001', shopName: 'Gözellik Bahçesi', status: 4,
        address: 'Magtymguly şaýoly 12, Aşgabat',
        items: [
            { sku: 'LOP-SH400', name: "L'Oreal Elseve şampon", qty: 2, price:  38.00 },
            { sku: 'NFW-200ML', name: 'Neutrogena ýüz ýuwujy', qty: 1, price:  42.00 },
        ],
    },
    {
        userPhone: '61100002', shopName: 'TeknoMart', status: 2,
        address: 'Bitarap Türkmenistan şaýoly 34, Aşgabat',
        items: [
            { sku: 'IP15-128', name: 'iPhone 15 128GB', qty: 1, price: 4200.00 },
        ],
    },
    {
        userPhone: '61100003', shopName: 'TeknoMart', status: 0,
        address: 'Garaşsyzlyk köçesi 7, Aşgabat',
        items: [
            { sku: 'LIP5-R5', name: 'Lenovo IdeaPad 5', qty: 1, price: 3800.00 },
        ],
    },
    {
        userPhone: '61100004', shopName: 'Sport Dünýäsi', status: 10,
        address: 'Oguzhan köçesi 19, Aşgabat',
        items: [
            { sku: 'NAM270', name: 'Nike Air Max 270', qty: 1, price: 450.00 },
        ],
    },
    {
        userPhone: '61100005', shopName: 'Moda Bazary', status: 1,
        address: 'Arçabil şaýoly 56, Aşgabat',
        items: [
            { sku: 'MJ-SLIM-BL', name: 'Erkek slim jinsjalbar', qty: 1, price: 280.00 },
        ],
    },
];

module.exports = async (db) => {
    console.log('  Checking existing orders…');

    const existing = await db.Order.count();
    if (existing > 0) {
        console.log(`  Skipping: ${existing} orders already exist`);
        return;
    }

    // Resolve user IDs
    const phones = [...new Set(ORDERS.map(o => o.userPhone))];
    const [userRows] = await db.sequelize.query(
        `SELECT id, phone_number FROM users WHERE phone_number IN (:phones) AND "deletedAt" IS NULL`,
        { replacements: { phones } }
    );
    const userMap = Object.fromEntries(userRows.map(u => [u.phone_number, u.id]));

    // Resolve shop IDs
    const shopNames = [...new Set(ORDERS.map(o => o.shopName))];
    const [shopRows] = await db.sequelize.query(
        `SELECT id, name FROM shops WHERE name IN (:names) AND "deletedAt" IS NULL`,
        { replacements: { names: shopNames } }
    );
    const shopMap = Object.fromEntries(shopRows.map(s => [s.name, s.id]));

    // Resolve product IDs by SKU
    const skus = [...new Set(ORDERS.flatMap(o => o.items.map(i => i.sku)))];
    const [productRows] = await db.sequelize.query(
        `SELECT id, sku FROM products WHERE sku IN (:skus) AND "deletedAt" IS NULL`,
        { replacements: { skus } }
    );
    const productMap = Object.fromEntries(productRows.map(p => [p.sku, p.id]));

    let created = 0;
    for (const order of ORDERS) {
        const userId = userMap[order.userPhone];
        const shopId = shopMap[order.shopName];
        if (!userId || !shopId) {
            console.log(`  Warning: skipping order for phone=${order.userPhone} shop=${order.shopName} (not found)`);
            continue;
        }

        const validItems = order.items.filter(i => productMap[i.sku]);
        if (!validItems.length) continue;

        const totalPrice = validItems.reduce((sum, i) => sum + i.qty * i.price, 0);

        const newOrder = await db.Order.create({
            user_id: userId,
            shop_id: shopId,
            status: order.status,
            total_price: totalPrice,
            currency: 'TMT',
            delivery_address: order.address,
        });

        await db.OrderItem.bulkCreate(
            validItems.map(i => ({
                order_id: newOrder.id,
                product_id: productMap[i.sku],
                product_name: i.name,
                quantity: i.qty,
                unit_price: i.price,
                total_price: i.qty * i.price,
            }))
        );
        created++;
    }

    console.log(`  Done: ${created} orders created`);
};
