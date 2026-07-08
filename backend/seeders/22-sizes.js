// Size taxonomy: parent "groups" (Clothing, Shoes, Kids …) with child size values.
// parent_id is a pure grouping/display aid — stock is always tracked per child size row.

const GROUPS = [
    { name: 'Egin-eşik ölçegleri',      name_ru: 'Размеры одежды',        name_eng: 'Clothing sizes',      slug: 'egin-esik-olcegleri',      sort_order: 1 },
    { name: 'Aýakgap ölçegleri',        name_ru: 'Размеры обуви',         name_eng: 'Shoe sizes (EU)',      slug: 'ayakgap-olcegleri',         sort_order: 2 },
    { name: 'Çaga egin-eşik ölçegleri', name_ru: 'Детские размеры одежды',name_eng: 'Kids clothing sizes',  slug: 'caga-egin-esik-olcegleri',  sort_order: 3 },
    { name: 'Çaga aýakgap ölçegleri',   name_ru: 'Детские размеры обуви', name_eng: 'Kids shoe sizes (EU)', slug: 'caga-ayakgap-olcegleri',    sort_order: 4 },
];

const CHILDREN = {
    'egin-esik-olcegleri': [
        { name: 'XS',  name_ru: 'XS',  name_eng: 'XS',  slug: 'xs',   sort_order: 1 },
        { name: 'S',   name_ru: 'S',   name_eng: 'S',   slug: 's',    sort_order: 2 },
        { name: 'M',   name_ru: 'M',   name_eng: 'M',   slug: 'm',    sort_order: 3 },
        { name: 'L',   name_ru: 'L',   name_eng: 'L',   slug: 'l',    sort_order: 4 },
        { name: 'XL',  name_ru: 'XL',  name_eng: 'XL',  slug: 'xl',   sort_order: 5 },
        { name: 'XXL', name_ru: 'XXL', name_eng: 'XXL', slug: 'xxl',  sort_order: 6 },
        { name: 'XXXL',name_ru: 'XXXL',name_eng: 'XXXL',slug: 'xxxl', sort_order: 7 },
    ],
    'ayakgap-olcegleri': Array.from({ length: 46 - 36 + 1 }, (_, i) => {
        const eu = 36 + i;
        return { name: String(eu), name_ru: String(eu), name_eng: String(eu), slug: `eu-${eu}`, sort_order: i + 1 };
    }),
    'caga-egin-esik-olcegleri': [
        { name: '0-3 aý',  name_ru: '0-3 мес',  name_eng: '0-3 mo',  slug: 'caga-0-3-ay',  sort_order: 1 },
        { name: '3-6 aý',  name_ru: '3-6 мес',  name_eng: '3-6 mo',  slug: 'caga-3-6-ay',  sort_order: 2 },
        { name: '6-12 aý', name_ru: '6-12 мес', name_eng: '6-12 mo', slug: 'caga-6-12-ay', sort_order: 3 },
        { name: '1-2 ýaş', name_ru: '1-2 года',  name_eng: '1-2 yr', slug: 'caga-1-2-yas', sort_order: 4 },
        { name: '2-3 ýaş', name_ru: '2-3 года',  name_eng: '2-3 yr', slug: 'caga-2-3-yas', sort_order: 5 },
        { name: '3-4 ýaş', name_ru: '3-4 года',  name_eng: '3-4 yr', slug: 'caga-3-4-yas', sort_order: 6 },
        { name: '4-5 ýaş', name_ru: '4-5 года',  name_eng: '4-5 yr', slug: 'caga-4-5-yas', sort_order: 7 },
        { name: '5-6 ýaş', name_ru: '5-6 года',  name_eng: '5-6 yr', slug: 'caga-5-6-yas', sort_order: 8 },
        { name: '7-8 ýaş', name_ru: '7-8 года',  name_eng: '7-8 yr', slug: 'caga-7-8-yas', sort_order: 9 },
    ],
    'caga-ayakgap-olcegleri': Array.from({ length: 35 - 20 + 1 }, (_, i) => {
        const eu = 20 + i;
        return { name: String(eu), name_ru: String(eu), name_eng: String(eu), slug: `caga-eu-${eu}`, sort_order: i + 1 };
    }),
};

module.exports = async (db) => {
    console.log('  Seeding sizes...');

    await db.Size.bulkCreate(GROUPS, { ignoreDuplicates: true });

    const groups = await db.Size.findAll({
        where: { slug: GROUPS.map((g) => g.slug) },
        attributes: ['id', 'slug'],
    });
    const slugToId = Object.fromEntries(groups.map((g) => [g.slug, g.id]));

    const children = [];
    for (const [parentSlug, sizes] of Object.entries(CHILDREN)) {
        const parentId = slugToId[parentSlug];
        if (!parentId) continue;
        sizes.forEach((s) => children.push({ ...s, parent_id: parentId }));
    }

    await db.Size.bulkCreate(children, { ignoreDuplicates: true });

    console.log(`  Done: ${GROUPS.length} groups + ${children.length} sizes`);
};
