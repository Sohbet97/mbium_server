/**
 * Seeder: Curated Collections
 * Idempotent — skips if any collections already exist.
 */

const COLLECTIONS = [
    {
        name:        'Täze geldi',
        name_ru:     'Новинки',
        name_eng:    'New Arrivals',
        description: 'Platforma goşulan iň täze harytlar.',
        description_ru: 'Самые новые товары, добавленные на платформу.',
        description_en: 'The freshest products just added to the platform.',
        slug:        'new-arrivals',
        is_active:   true,
        sort_order:  1,
    },
    {
        name:        'Iň köp satylýan',
        name_ru:     'Лидеры продаж',
        name_eng:    'Best Sellers',
        description: 'Müşderileriň iň köp satyn alýan harytlary.',
        description_ru: 'Самые популярные товары среди покупателей.',
        description_en: 'The most purchased products by our customers.',
        slug:        'best-sellers',
        is_active:   true,
        sort_order:  2,
    },
    {
        name:        'Arzanladyş',
        name_ru:     'Скидки',
        name_eng:    'On Sale',
        description: 'Aýratyn baha arzanladyşly harytlar.',
        description_ru: 'Товары с особыми скидками.',
        description_en: 'Products with special price reductions.',
        slug:        'on-sale',
        is_active:   true,
        sort_order:  3,
    },
    {
        name:        'Saýlama önümler',
        name_ru:     'Избранное',
        name_eng:    'Featured',
        description: 'Redaktory tarapyndan saýlanan premium harytlar.',
        description_ru: 'Премиум товары, отобранные редакторами.',
        description_en: 'Premium products hand-picked by our editors.',
        slug:        'featured',
        is_active:   true,
        sort_order:  4,
    },
    {
        name:        'Möwsümleýin kolleksiýa',
        name_ru:     'Сезонная коллекция',
        name_eng:    'Seasonal Collection',
        description: 'Häzirki möwsüm üçin iň amatly önümler.',
        description_ru: 'Лучшие товары для текущего сезона.',
        description_en: 'Best products suited for the current season.',
        slug:        'seasonal',
        is_active:   true,
        sort_order:  5,
    },
];

module.exports = async (db) => {
    console.log('  Seeding collections...');

    let created = 0;
    for (const col of COLLECTIONS) {
        const [, wasCreated] = await db.Collection.findOrCreate({
            where: { slug: col.slug },
            defaults: col,
        });
        if (wasCreated) created++;
        else console.log(`  Collection '${col.slug}' already exists — skipping`);
    }

    if (created > 0) console.log(`  Done: ${created} collections created`);
};
