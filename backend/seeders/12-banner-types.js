// Banner placements. `slug` is the stable code the mobile app filters by
// (GET /buyer/banners?type=main_page); ids differ between environments.
// Prices are starting values — admins can change them in Banners → "Placements & prices".
const DEFAULT_TYPES = [
    { slug: 'main_page',     name: 'Baş sahypa',      name_ru: 'Главная страница',   name_eng: 'Main page',     description: 'Main slider on the app home page',        price_per_day_tmt: 30, price_per_day_coin: 300, max_days: 30 },
    { slug: 'shop_page',     name: 'Dükan sahypasy',  name_ru: 'Страница магазина',  name_eng: 'Shop page',     description: 'Banner on the seller\'s own shop page',   price_per_day_tmt: 10, price_per_day_coin: 100, max_days: 30 },
    { slug: 'category_page', name: 'Kategoriýa sahypasy', name_ru: 'Страница категории', name_eng: 'Category page', description: 'Banner on category listing pages',    price_per_day_tmt: 15, price_per_day_coin: 150, max_days: 30 },
    { slug: 'search_page',   name: 'Gözleg sahypasy', name_ru: 'Страница поиска',    name_eng: 'Search page',   description: 'Banner on the search screen',             price_per_day_tmt: 10, price_per_day_coin: 100, max_days: 30 },
    { slug: 'popup',         name: 'Açylýan banner',  name_ru: 'Всплывающий баннер', name_eng: 'Popup',         description: 'Popup / overlay banner on app open',      price_per_day_tmt: 40, price_per_day_coin: 400, max_days: 14 },
]

// Older slugs from the first version of this seeder → new codes (keeps existing banners attached).
const LEGACY_RENAMES = { home_hero: 'main_page', category: 'category_page' }

module.exports = async (db) => {
    for (const [from, to] of Object.entries(LEGACY_RENAMES)) {
        const old = await db.BannerType.findOne({ where: { slug: from } })
        if (old && !(await db.BannerType.findOne({ where: { slug: to } }))) await old.update({ slug: to })
    }

    for (const type of DEFAULT_TYPES) {
        const [row, created] = await db.BannerType.findOrCreate({
            where: { slug: type.slug },
            defaults: { ...type, is_active: true },
        })
        if (created) continue
        // Existing row: only fill pricing that was never set, never overwrite admin edits.
        const fill = {}
        for (const k of ['price_per_day_tmt', 'price_per_day_coin', 'max_days']) {
            if (row[k] == null) fill[k] = type[k]
        }
        if (Object.keys(fill).length) await row.update(fill)
    }
    console.log('[seeder] banner_types seeded')
}
