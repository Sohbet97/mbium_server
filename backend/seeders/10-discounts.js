/**
 * Seeder: discount coupon codes for testing checkout flows.
 * Idempotent — skips if any discount codes already exist.
 *
 * Codes:
 *   WELCOME10  — 10% off any order ≥ 100 TMT (platform-wide)
 *   TEKNO20    — 20% off TeknoMart orders ≥ 2000 TMT
 *   FREESHIP   — free shipping on any order ≥ 500 TMT
 *   MODA50     — 50 TMT fixed off Moda Bazary orders ≥ 300 TMT
 *   SUMMER25   — 25% off everything, expires 2026-08-31
 *   SPORT15    — 15% off Sport Dünýäsi orders ≥ 400 TMT
 */

const DISCOUNTS = [
    {
        shopName: null,
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        min_order_amount: 100,
        max_uses: 500,
        ends_at: null,
        is_active: true,
    },
    {
        shopName: 'TeknoMart',
        code: 'TEKNO20',
        type: 'PERCENTAGE',
        value: 20,
        min_order_amount: 2000,
        max_uses: 100,
        ends_at: null,
        is_active: true,
    },
    {
        shopName: null,
        code: 'FREESHIP',
        type: 'FREE_SHIPPING',
        value: 0,
        min_order_amount: 500,
        max_uses: null,
        ends_at: null,
        is_active: true,
    },
    {
        shopName: 'Moda Bazary',
        code: 'MODA50',
        type: 'FIXED',
        value: 50,
        min_order_amount: 300,
        max_uses: 200,
        ends_at: null,
        is_active: true,
    },
    {
        shopName: null,
        code: 'SUMMER25',
        type: 'PERCENTAGE',
        value: 25,
        min_order_amount: null,
        max_uses: 1000,
        ends_at: new Date('2026-08-31'),
        is_active: true,
    },
    {
        shopName: 'Sport Dünýäsi',
        code: 'SPORT15',
        type: 'PERCENTAGE',
        value: 15,
        min_order_amount: 400,
        max_uses: 50,
        ends_at: null,
        is_active: true,
    },
];

module.exports = async (db) => {
    console.log('  Checking existing discounts…');

    const codes = DISCOUNTS.map(d => d.code);
    const existing = await db.Discount.count({ where: { code: codes } });

    if (existing === DISCOUNTS.length) {
        console.log(`  Skipping: all ${DISCOUNTS.length} discount codes already exist`);
        return;
    }

    // Resolve shop IDs for shop-specific discounts
    const shopNames = [...new Set(DISCOUNTS.filter(d => d.shopName).map(d => d.shopName))];
    const [shopRows] = await db.sequelize.query(
        `SELECT id, name FROM shops WHERE name IN (:names) AND "deletedAt" IS NULL`,
        { replacements: { names: shopNames } }
    );
    const shopMap = Object.fromEntries(shopRows.map(s => [s.name, s.id]));

    const existingCodes = new Set(
        (await db.Discount.findAll({ where: { code: codes }, attributes: ['code'] }))
            .map(d => d.code)
    );

    const rows = DISCOUNTS
        .filter(d => !existingCodes.has(d.code))
        .map(({ shopName, ...fields }) => ({
            ...fields,
            shop_id: shopName ? (shopMap[shopName] ?? null) : null,
        }));

    await db.Discount.bulkCreate(rows);
    console.log(`  Done: ${rows.length} discount code(s) created`);
    console.log('');
    console.log('  ┌──────────────────────────────────────────────────┐');
    rows.forEach(d => {
        const scope = d.shop_id ? `shop ${d.shop_id}` : 'platform-wide';
        console.log(`  │  ${d.code.padEnd(10)}  ${String(d.value).padStart(4)}${d.type === 'FIXED' ? ' TMT' : d.type === 'FREE_SHIPPING' ? '     ' : '%    '}  ${scope}`);
    });
    console.log('  └──────────────────────────────────────────────────┘');
};
