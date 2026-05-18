const DEFAULT_TYPES = [
    { name: 'Baş sahypa gahrymany', name_ru: 'Главный баннер',         name_eng: 'Homepage Hero',       slug: 'home_hero',    description: 'Main hero/slider on the homepage' },
    { name: 'Kategoriýa banneri',   name_ru: 'Баннер категории',        name_eng: 'Category Banner',     slug: 'category',     description: 'Promotional banner on category pages' },
    { name: 'Aksiýa banneri',       name_ru: 'Акционный баннер',        name_eng: 'Promotional Banner',  slug: 'promotion',    description: 'Sale / campaign promotional banner' },
    { name: 'Gapdal banner',        name_ru: 'Боковой баннер',          name_eng: 'Sidebar Banner',      slug: 'sidebar',      description: 'Smaller banner displayed in sidebar areas' },
    { name: 'Açylýan banner',       name_ru: 'Всплывающий баннер',      name_eng: 'Popup Banner',        slug: 'popup',        description: 'Popup / overlay banner' },
]

module.exports = async (db) => {
    for (const type of DEFAULT_TYPES) {
        await db.BannerType.findOrCreate({
            where: { slug: type.slug },
            defaults: { ...type, is_active: true },
        })
    }
    console.log('[seeder] banner_types seeded')
}
