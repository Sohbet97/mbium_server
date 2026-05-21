/**
 * Seeder: Curated Collections
 * Idempotent — deduplicates by handle (the URL-friendly slug field on the model).
 */

const COLLECTIONS = [
    {
        name:        'Täze geldi',
        name_ru:     'Новинки',
        name_eng:    'New Arrivals',
        description: 'Platforma goşulan iň täze harytlar.',
        handle:      'new-arrivals',
        is_active:   true,
        sort_order:  1,
    },
    {
        name:        'Iň köp satylýan',
        name_ru:     'Лидеры продаж',
        name_eng:    'Best Sellers',
        description: 'Müşderileriň iň köp satyn alýan harytlary.',
        handle:      'best-sellers',
        is_active:   true,
        sort_order:  2,
    },
    {
        name:        'Arzanladyş',
        name_ru:     'Скидки',
        name_eng:    'On Sale',
        description: 'Aýratyn baha arzanladyşly harytlar.',
        handle:      'on-sale',
        is_active:   true,
        sort_order:  3,
    },
    {
        name:        'Saýlama önümler',
        name_ru:     'Избранное',
        name_eng:    'Featured',
        description: 'Redaktory tarapyndan saýlanan premium harytlar.',
        handle:      'featured',
        is_active:   true,
        sort_order:  4,
    },
    {
        name:        'Möwsümleýin kolleksiýa',
        name_ru:     'Сезонная коллекция',
        name_eng:    'Seasonal Collection',
        description: 'Häzirki möwsüm üçin iň amatly önümler.',
        handle:      'seasonal',
        is_active:   true,
        sort_order:  5,
    },
];

module.exports = async (db) => {
    console.log('  Seeding collections...');

    let created = 0;
    for (const col of COLLECTIONS) {
        const [, wasCreated] = await db.Collection.findOrCreate({
            where: { handle: col.handle },
            defaults: col,
        });
        if (wasCreated) created++;
        else console.log(`  Collection '${col.handle}' already exists — skipping`);
    }

    if (created > 0) console.log(`  Done: ${created} collections created`);
};
