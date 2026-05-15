const PRODUCTS = [
    {
        categorySlug: 'telefonlar',
        name: 'Samsung Galaxy A54',
        name_ru: 'Самсунг Гэлакси А54',
        name_eng: 'Samsung Galaxy A54',
        description: '6.4" Super AMOLED ekran, 128GB ýat, 5000mAh batareýa, 50MP dört kameraly sistema',
        price: 1590.00, sku: 'SGA54-128', stock: 50,
    },
    {
        categorySlug: 'telefonlar',
        name: 'iPhone 15 128GB',
        name_ru: 'Айфон 15 128 ГБ',
        name_eng: 'iPhone 15 128GB',
        description: '6.1" Super Retina XDR, A16 Bionic çip, 48MP esasy kamera, Dynamic Island',
        price: 4200.00, sku: 'IP15-128', stock: 20,
    },
    {
        categorySlug: 'telefonlar',
        name: 'Xiaomi Redmi Note 13',
        name_ru: 'Сяоми Редми Ноут 13',
        name_eng: 'Xiaomi Redmi Note 13',
        description: '6.67" AMOLED, 108MP kamera, 5000mAh, Snapdragon 685',
        price: 990.00, sku: 'XRN13-128', stock: 80,
    },
    {
        categorySlug: 'noutbuklar',
        name: 'Lenovo IdeaPad 5',
        name_ru: 'Леново АйдиаПад 5',
        name_eng: 'Lenovo IdeaPad 5',
        description: '15.6" FHD IPS, AMD Ryzen 5 5500U, 8GB RAM, 512GB SSD, Windows 11',
        price: 3800.00, sku: 'LIP5-R5', stock: 15,
    },
    {
        categorySlug: 'noutbuklar',
        name: 'ASUS VivoBook 15',
        name_ru: 'Асус ВивоБук 15',
        name_eng: 'ASUS VivoBook 15',
        description: '15.6" FHD, Intel Core i5-1235U, 16GB RAM, 512GB SSD',
        price: 4100.00, sku: 'AVB15-I5', stock: 10,
    },
    {
        categorySlug: 'telewizorlar',
        name: 'Samsung Smart TV 50"',
        name_ru: 'Самсунг Смарт ТВ 50"',
        name_eng: 'Samsung Smart TV 50"',
        description: '4K UHD Crystal, HDR10+, Tizen OS, Wi-Fi, Bluetooth, 3x HDMI',
        price: 3200.00, sku: 'SST50-4K', stock: 8,
    },
    {
        categorySlug: 'gulaklyklar',
        name: 'Sony WH-1000XM5',
        name_ru: 'Сони ВХ-1000ХМ5',
        name_eng: 'Sony WH-1000XM5',
        description: 'Çuňňur zyýanly ses azaldyjy, 30 sagat batareýa, Hi-Res Audio, Multipoint Bluetooth',
        price: 1250.00, sku: 'SWH1KXM5', stock: 25,
    },
    {
        categorySlug: 'erkek-geyimleri',
        name: 'Erkek slim jinsjalbar',
        name_ru: 'Мужские джинсы слим',
        name_eng: "Men's Slim Jeans",
        description: 'Klasiki slim kesiş, 100% pagta denim, doly reňk toplumy',
        price: 280.00, sku: 'MJ-SLIM-BL', stock: 100,
    },
    {
        categorySlug: 'erkek-geyimleri',
        name: 'Erkek polo köýnek',
        name_ru: 'Мужская рубашка поло',
        name_eng: "Men's Polo Shirt",
        description: '100% pagta pique, dem alýan material, ýakasy bolan',
        price: 145.00, sku: 'MP-POLO-01', stock: 150,
    },
    {
        categorySlug: 'ayyakgap',
        name: 'Nike Air Max 270',
        name_ru: 'Найк Эйр Макс 270',
        name_eng: 'Nike Air Max 270',
        description: 'Uly howa ýassygy bilen aşaky bölegi, mesh ýüzi, amatly geýiş',
        price: 450.00, sku: 'NAM270', stock: 40,
    },
    {
        categorySlug: 'ashana-enjamlary',
        name: 'Aşhana blenderi',
        name_ru: 'Кухонный блендер',
        name_eng: 'Kitchen Blender',
        description: '1000W güýçli motor, 1.5L aýna gab, 5 tizlik, buz ugrulýan',
        price: 185.00, sku: 'KB-1000W', stock: 30,
    },
    {
        categorySlug: 'ashana-enjamlary',
        name: 'Çaýnik elektrik',
        name_ru: 'Электрический чайник',
        name_eng: 'Electric Kettle',
        description: '1.7L, 2200W, 360° bazasy, poslamaýan polat içi',
        price: 95.00, sku: 'EK-17L', stock: 60,
    },
    {
        categorySlug: 'fitnes-enjamlary',
        name: 'Fitnes guşagy',
        name_ru: 'Фитнес браслет',
        name_eng: 'Smart Fitness Band',
        description: 'Ýürek urşy, ganda kislorod, uky derňewi, suw geçirmeýän IP68',
        price: 175.00, sku: 'FB-SMART', stock: 60,
    },
    {
        categorySlug: 'sac-idegi',
        name: "L'Oreal Elseve şampon",
        name_ru: 'Шампунь Лореаль Эльсев',
        name_eng: "L'Oreal Elseve Shampoo",
        description: 'Keratin bilen güýçlendirilen, zaýalanan saçlary dikeldýär, ähli saç görnüşleri üçin',
        price: 38.00, sku: 'LOP-SH400', stock: 200,
    },
    {
        categorySlug: 'deri-idegi',
        name: 'Neutrogena ýüz ýuwujy',
        name_ru: 'Нейтрожена гель для умывания',
        name_eng: 'Neutrogena Face Wash',
        description: 'Salisilik asid bilen, gözenekleri arassalaýar, ýag derä laýyk',
        price: 42.00, sku: 'NFW-200ML', stock: 120,
    },
];

module.exports = async (db) => {
    console.log('  Seeding products...');

    const existing = await db.Product.count();
    if (existing > 0) {
        console.log(`  Skipping: ${existing} products already exist`);
        return;
    }

    const [shopRows] = await db.sequelize.query(
        `SELECT id FROM shops WHERE "deletedAt" IS NULL LIMIT 1`
    );
    if (!shopRows.length) {
        console.log('  Skipping: no shops found — create a shop first, then re-run');
        return;
    }
    const shopId = shopRows[0].id;

    const slugs = [...new Set(PRODUCTS.map(p => p.categorySlug))];
    const categories = await db.Category.findAll({
        where: { slug: slugs },
        attributes: ['id', 'slug'],
    });
    const cat = Object.fromEntries(categories.map(c => [c.slug, c.id]));

    const rows = PRODUCTS
        .filter(p => cat[p.categorySlug])
        .map(({ categorySlug, ...fields }) => ({
            ...fields,
            shop_id: shopId,
            category_id: cat[categorySlug],
            currency: 'TMT',
            status: 0,
            is_active: true,
        }));

    await db.Product.bulkCreate(rows);
    console.log(`  Done: ${rows.length} products (shop_id: ${shopId})`);
};
