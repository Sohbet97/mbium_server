// Each shop definition uses a typeName to look up the type_id after shop types are seeded
const SHOPS = [
    {
        typeName: 'Elektronika dükany',
        name: 'TeknoMart',
        name_ru: 'ТекноМарт',
        name_eng: 'TeknoMart',
        description: 'Türkmenistanyň iň uly elektron söwda dükany. Telefonlar, noutbuklar, telewizorlar we başgalar.',
        phone: '61123456',
        email: 'info@teknomart.tm',
        address: 'Magtymguly şaýoly 89',
        order: 1,
        status: 0,
        is_active: true,
        is_verified: true,
        rating: 4.80,
    },
    {
        typeName: 'Egin-eşik dükany',
        name: 'Moda Bazary',
        name_ru: 'Мода Базары',
        name_eng: 'Moda Bazary',
        description: 'Erkekler, aýallar we çagalar üçin iň täze moda egin-eşikleri. Türk, Hytaý we ýerli brendler.',
        phone: '62234567',
        email: 'contact@modabazary.tm',
        address: 'Bitarap Türkmenistan şaýoly 12',
        order: 2,
        status: 0,
        is_active: true,
        is_verified: true,
        rating: 4.60,
    },
    {
        typeName: 'Ählumumy dükany',
        name: 'Güneş Market',
        name_ru: 'Гюнеш Маркет',
        name_eng: 'Güneş Market',
        description: 'Gündelik durmuş üçin zerur ähli harytlar: azyk, arassaçylyk, öý enjamlary we başgalar.',
        phone: '63345678',
        email: 'hello@gunesmarket.tm',
        address: 'Garaşsyzlyk şaýoly 45',
        order: 3,
        status: 0,
        is_active: true,
        is_verified: false,
        rating: 4.30,
    },
    {
        typeName: 'Sport dükany',
        name: 'Sport Dünýäsi',
        name_ru: 'Мир Спорта',
        name_eng: 'Sport World',
        description: 'Ähli sport görnüşleri üçin egin-eşik, aýakgap we enjamlar. Adidas, Nike, Reebok we başgalar.',
        phone: '64456789',
        email: 'sport@sportdunyasi.tm',
        address: 'Oguzhan köçesi 7',
        order: 4,
        status: 0,
        is_active: true,
        is_verified: true,
        rating: 4.70,
    },
    {
        typeName: 'Gözellik dükany',
        name: 'Gözellik Bahçesi',
        name_ru: 'Сад Красоты',
        name_eng: 'Beauty Garden',
        description: 'Dünýä belli brendleriň kosmetika, parfýumeriýa we deri ideg önümleri.',
        phone: '65567890',
        email: 'beauty@gozellikbahcesi.tm',
        address: 'Arçabil şaýoly 22',
        order: 5,
        status: 0,
        is_active: true,
        is_verified: false,
        rating: 4.50,
    }
];

module.exports = async (db) => {
    console.log('  Seeding shops...');

    const existing = await db.Shop.count();

    if (existing > 0) {
        console.log(`  Skipping: ${existing} shops already exist`);
        return;
    }

    // Shops require an owner — use the first available user
    const [userRows] = await db.sequelize.query(
        `SELECT id FROM users WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1`
    );
    if (!userRows.length) {
        console.log('  Skipping: no users found — register a user first, then re-run');
        return;
    }
    const ownerId = userRows[0].id;

    // Resolve type IDs by name
    const typeNames = SHOPS.map(s => s.typeName);
    const [typeRows] = await db.sequelize.query(
        `SELECT id, name FROM shop_types WHERE "deletedAt" IS NULL AND name IN (:names)`,
        { replacements: { names: typeNames } }
    );
    const typeMap = Object.fromEntries(typeRows.map(t => [t.name, t.id]));

    const rows = SHOPS
        .filter(s => typeMap[s.typeName])
        .map(({ typeName, ...fields }) => ({
            ...fields,
            owner_id: ownerId,
            type_id: typeMap[typeName],
        }));

    if (!rows.length) {
        console.log('  Skipping: no matching shop types found — run shop-types seeder first');
        return;
    }

    await db.Shop.bulkCreate(rows);
    console.log(`  Done: ${rows.length} shops (owner_id: ${ownerId})`);
};
