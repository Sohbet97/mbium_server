const SHOP_TYPES = [
    { name: 'Ählumumy dükany',       name_ru: 'Универсальный магазин',     name_eng: 'General Store',        order: 1, is_active: true },
    { name: 'Elektronika dükany',    name_ru: 'Магазин электроники',        name_eng: 'Electronics Store',    order: 2, is_active: true },
    { name: 'Egin-eşik dükany',      name_ru: 'Магазин одежды',            name_eng: 'Clothing Store',        order: 3, is_active: true },
    { name: 'Azyk dükany',           name_ru: 'Продуктовый магазин',       name_eng: 'Grocery Store',         order: 4, is_active: true },
    { name: 'Gözellik dükany',       name_ru: 'Магазин красоты',           name_eng: 'Beauty Store',          order: 5, is_active: true },
    { name: 'Sport dükany',          name_ru: 'Спортивный магазин',        name_eng: 'Sports Store',          order: 6, is_active: true },
    { name: 'Öý we bagy dükany',     name_ru: 'Магазин для дома и сада',   name_eng: 'Home & Garden Store',   order: 7, is_active: true },
    { name: 'Çagalar dükany',        name_ru: 'Детский магазин',           name_eng: 'Kids Store',            order: 8, is_active: true },
    { name: 'Awtomobil dükany',      name_ru: 'Автомагазин',               name_eng: 'Automotive Store',      order: 9, is_active: true },
    { name: 'Kitap we gymmatlyklar', name_ru: 'Книги и ценности',          name_eng: 'Books & Collectibles',  order: 10, is_active: true },
];

module.exports = async (db) => {
    console.log('  Seeding shop types...');

    const existing = await db.ShopType.count();
    if (existing > 0) {
        console.log(`  Skipping: ${existing} shop types already exist`);
        return;
    }

    await db.ShopType.bulkCreate(SHOP_TYPES);
    console.log(`  Done: ${SHOP_TYPES.length} shop types`);
};
