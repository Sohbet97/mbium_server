const DELIVERY_TYPES = [
    { name: 'Kurýer arkaly eltip bermek', name_ru: 'Курьерская доставка',     name_en: 'Courier delivery', code: 'courier', sort_order: 1 },
    { name: 'Özi alyp gitmek',            name_ru: 'Самовывоз',              name_en: 'Pickup',           code: 'pickup',  sort_order: 2 },
    { name: 'Ýük daşama (kargo)',         name_ru: 'Грузоперевозка (карго)', name_en: 'Cargo shipping',   code: 'cargo',   sort_order: 3 },
];

module.exports = async (db) => {
    console.log('  Seeding delivery types...');

    await db.DeliveryType.bulkCreate(DELIVERY_TYPES, { ignoreDuplicates: true });

    console.log(`  Done: ${DELIVERY_TYPES.length} delivery types`);
};
