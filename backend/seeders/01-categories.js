const ROOT_CATEGORIES = [
    { name: 'Elektronika',        name_ru: 'Электроника',           name_eng: 'Electronics',      slug: 'elektronika',         order: 1, status: 0 },
    { name: 'Egin-eşik',          name_ru: 'Одежда',                name_eng: 'Clothing',          slug: 'egin-esik',           order: 2, status: 0 },
    { name: 'Öý we bagy',         name_ru: 'Дом и сад',             name_eng: 'Home & Garden',     slug: 'oy-we-bagy',          order: 3, status: 0 },
    { name: 'Iýmit we içgi',      name_ru: 'Продукты и напитки',    name_eng: 'Food & Beverages',  slug: 'iymit-we-icgi',       order: 4, status: 0 },
    { name: 'Gözellik we saglyk', name_ru: 'Красота и здоровье',    name_eng: 'Beauty & Health',   slug: 'gozellik-we-saglyk',  order: 5, status: 0 },
    { name: 'Sport',              name_ru: 'Спорт',                 name_eng: 'Sports',            slug: 'sport',               order: 6, status: 0 },
    { name: 'Awtomobil',          name_ru: 'Автомобиль',            name_eng: 'Automotive',        slug: 'awtomobil',           order: 7, status: 0 },
    { name: 'Çagalar üçin',       name_ru: 'Для детей',             name_eng: 'Kids',              slug: 'cagalar-ucin',        order: 8, status: 0 },
];

const SUB_CATEGORIES = {
    'elektronika': [
        { name: 'Telefonlar',        name_ru: 'Телефоны',              name_eng: 'Phones',              slug: 'telefonlar',           order: 1, status: 0 },
        { name: 'Noutbuklar',        name_ru: 'Ноутбуки',              name_eng: 'Laptops',             slug: 'noutbuklar',           order: 2, status: 0 },
        { name: 'Telewizorlar',      name_ru: 'Телевизоры',            name_eng: 'TVs',                 slug: 'telewizorlar',         order: 3, status: 0 },
        { name: 'Planşetler',        name_ru: 'Планшеты',              name_eng: 'Tablets',             slug: 'plansetler',           order: 4, status: 0 },
        { name: 'Gulaklyklar',       name_ru: 'Наушники',              name_eng: 'Headphones',          slug: 'gulaklyklar',          order: 5, status: 0 },
        { name: 'Fotoaparatlar',     name_ru: 'Фотоаппараты',          name_eng: 'Cameras',             slug: 'fotoaparatlar',        order: 6, status: 0 },
    ],
    'egin-esik': [
        { name: 'Erkek geýimleri',   name_ru: 'Мужская одежда',        name_eng: "Men's Clothing",      slug: 'erkek-geyimleri',      order: 1, status: 0 },
        { name: 'Aýal geýimleri',    name_ru: 'Женская одежда',        name_eng: "Women's Clothing",    slug: 'ayal-geyimleri',       order: 2, status: 0 },
        { name: 'Çaga geýimleri',    name_ru: 'Детская одежда',        name_eng: "Children's Clothing", slug: 'caga-geyimleri',       order: 3, status: 0 },
        { name: 'Aýakgap',           name_ru: 'Обувь',                 name_eng: 'Footwear',            slug: 'ayyakgap',             order: 4, status: 0 },
        { name: 'Aksessuarlar',      name_ru: 'Аксессуары',            name_eng: 'Accessories',         slug: 'aksessuarlar',         order: 5, status: 0 },
    ],
    'oy-we-bagy': [
        { name: 'Mebel',             name_ru: 'Мебель',                name_eng: 'Furniture',           slug: 'mebel',                order: 1, status: 0 },
        { name: 'Aşhana enjamlary',  name_ru: 'Кухонная техника',      name_eng: 'Kitchen Appliances',  slug: 'ashana-enjamlary',     order: 2, status: 0 },
        { name: 'Bezeg harytlary',   name_ru: 'Товары для декора',     name_eng: 'Decor Items',         slug: 'bezeg-harytlary',      order: 3, status: 0 },
        { name: 'Bag we howly',      name_ru: 'Сад и двор',            name_eng: 'Garden & Yard',       slug: 'bag-we-howly',         order: 4, status: 0 },
    ],
    'gozellik-we-saglyk': [
        { name: 'Makiýaž',           name_ru: 'Макияж',                name_eng: 'Makeup',              slug: 'makiyaz',              order: 1, status: 0 },
        { name: 'Parfiýumeriýa',     name_ru: 'Парфюмерия',            name_eng: 'Perfume',             slug: 'parfiyumeriya',        order: 2, status: 0 },
        { name: 'Saç idegi',         name_ru: 'Уход за волосами',      name_eng: 'Hair Care',           slug: 'sac-idegi',            order: 3, status: 0 },
        { name: 'Deri idegi',        name_ru: 'Уход за кожей',         name_eng: 'Skin Care',           slug: 'deri-idegi',           order: 4, status: 0 },
        { name: 'Erkek bakym',       name_ru: 'Уход для мужчин',       name_eng: "Men's Grooming",      slug: 'erkek-bakym',          order: 5, status: 0 },
    ],
    'sport': [
        { name: 'Fitnes enjamlary',  name_ru: 'Фитнес оборудование',   name_eng: 'Fitness Equipment',   slug: 'fitnes-enjamlary',     order: 1, status: 0 },
        { name: 'Sport egin-eşigi',  name_ru: 'Спортивная одежда',     name_eng: 'Sportswear',          slug: 'sport-egin-esigi',     order: 2, status: 0 },
        { name: 'Açyk howa sporty',  name_ru: 'Активный отдых',        name_eng: 'Outdoor Sports',      slug: 'acyk-howa-sporty',     order: 3, status: 0 },
        { name: 'Welosiped',         name_ru: 'Велосипеды',            name_eng: 'Bicycles',            slug: 'welosiped',            order: 4, status: 0 },
    ],
    'awtomobil': [
        { name: 'Awtoulag ätiýaçlyk şaýlary', name_ru: 'Автозапчасти', name_eng: 'Car Parts',         slug: 'awtoulag-atiýaclyk',   order: 1, status: 0 },
        { name: 'Awtoulag aksessuarlary',      name_ru: 'Автоаксессуары', name_eng: 'Car Accessories', slug: 'awtoulag-aksessuar',   order: 2, status: 0 },
    ],
    'cagalar-ucin': [
        { name: 'Çaga oýnawaçlary',  name_ru: 'Игрушки',               name_eng: 'Toys',                slug: 'caga-oynawaclar',      order: 1, status: 0 },
        { name: 'Bäbek harytlary',   name_ru: 'Товары для малышей',    name_eng: 'Baby Products',       slug: 'babek-harytlary',      order: 2, status: 0 },
        { name: 'Mekdep harytlary',  name_ru: 'Школьные товары',       name_eng: 'School Supplies',     slug: 'mekdep-harytlary',     order: 3, status: 0 },
    ],
};

module.exports = async (db) => {
    console.log('  Seeding categories...');

    await db.Category.bulkCreate(ROOT_CATEGORIES, { ignoreDuplicates: true });

    const roots = await db.Category.findAll({
        where: { slug: ROOT_CATEGORIES.map(c => c.slug) },
        attributes: ['id', 'slug'],
    });

    const slugToId = Object.fromEntries(roots.map(r => [r.slug, r.id]));

    const children = [];
    for (const [parentSlug, subs] of Object.entries(SUB_CATEGORIES)) {
        const parentId = slugToId[parentSlug];
        if (!parentId) continue;
        subs.forEach(sub => children.push({ ...sub, parent_id: parentId }));
    }

    await db.Category.bulkCreate(children, { ignoreDuplicates: true });

    console.log(`  Done: ${ROOT_CATEGORIES.length} root + ${children.length} subcategories`);
};
