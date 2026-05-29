// Creates one default warehouse per shop and populates inventory levels
// from the existing Product.stock / ProductVariant.stock values.

const WAREHOUSES = [
    { shopName: 'TeknoMart',       name: 'TeknoMart Merkezi Ammar',    city: 'Aşgabat', address: 'Magtymguly şaýoly 89, Ammar binasy' },
    { shopName: 'Moda Bazary',     name: 'Moda Bazary Ammar',          city: 'Aşgabat', address: 'Bitarap Türkmenistan şaýoly 12' },
    { shopName: 'Güneş Market',    name: 'Güneş Market Ammar',         city: 'Aşgabat', address: 'Garaşsyzlyk şaýoly 45' },
    { shopName: 'Sport Dünýäsi',   name: 'Sport Dünýäsi Ammar',        city: 'Aşgabat', address: 'Oguzhan köçesi 7' },
    { shopName: 'Gözellik Bahçesi', name: 'Gözellik Bahçesi Ammar',    city: 'Aşgabat', address: 'Arçabil şaýoly 22' },
];

module.exports = async (db) => {
    console.log('  Seeding warehouses...');

    const existing = await db.Warehouse.count();
    if (existing > 0) {
        console.log(`  Skipping: ${existing} warehouses already exist`);
        return;
    }

    const [shopRows] = await db.sequelize.query(
        `SELECT id, name FROM shops WHERE "deletedAt" IS NULL ORDER BY id ASC`
    );
    if (!shopRows.length) {
        console.log('  Skipping: no shops found — run shops seeder first');
        return;
    }

    const shopMap = Object.fromEntries(shopRows.map(s => [s.name, s.id]));

    let created = 0;
    for (const def of WAREHOUSES) {
        const shop_id = shopMap[def.shopName];
        if (!shop_id) {
            console.log(`  Warning: shop "${def.shopName}" not found, skipping warehouse`);
            continue;
        }
        await db.Warehouse.create({
            shop_id,
            name:          def.name,
            city:          def.city,
            address:       def.address,
            contact_phone: null,
            is_active:     true,
            is_default:    true,
        });
        created++;
    }

    // Also create a catch-all warehouse for any other shops without one
    for (const shop of shopRows) {
        if (WAREHOUSES.some(w => shopMap[w.shopName] === shop.id)) continue;
        await db.Warehouse.create({
            shop_id:    shop.id,
            name:       `${shop.name} Ammar`,
            city:       'Aşgabat',
            is_active:  true,
            is_default: true,
        });
        created++;
    }

    console.log(`  Done: ${created} warehouses created`);
};
