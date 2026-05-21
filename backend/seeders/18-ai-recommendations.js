/**
 * Seeder: AI agent suggestion cards shown on the buyer mobile app.
 * Idempotent — skips individual rows that already exist (matched by prompt text).
 *
 * Cards are ordered by sort_order and displayed as quick-tap suggestions
 * on the AI Agent screen. The `prompt` field is sent to the AI when tapped.
 */

const RECOMMENDATIONS = [
    {
        emoji: '🛍️',
        title_tk: 'Iň gowy önürijini tap',
        title_ru: 'Найди лучшего продавца',
        title_en: 'Find the best seller',
        subtitle_tk: 'Gurluşyk harytlaryny önürijän telekeçi gözleýän',
        subtitle_ru: 'Ищу предпринимателя, продающего строительные товары',
        subtitle_en: 'Looking for a seller dealing in construction goods',
        prompt: 'Gurluşyk harytlaryny satan iň gowy we ygtybarly dükany maslahat ber.',
        sort_order: 1,
        is_active: true,
    },
    {
        emoji: '🌟',
        title_tk: 'Özüňize täze tendensiyalary açyň',
        title_ru: 'Откройте для себя новые тренды',
        title_en: 'Discover new trends for you',
        subtitle_tk: 'Welayatlar boyunça haysy haryt has köp satylandygyny an...',
        subtitle_ru: 'Узнай, какие товары продаются больше всего по регионам',
        subtitle_en: 'Find out which products sell most by region',
        prompt: 'Häzirki wagtda Türkmenistanda iň köp satylýan we meşhur önümleri aýt.',
        sort_order: 2,
        is_active: true,
    },
    {
        emoji: '🎨',
        title_tk: 'Harytlary AI dizaýn et',
        title_ru: 'Создай товар с помощью AI',
        title_en: 'Design products with AI',
        subtitle_tk: null,
        subtitle_ru: null,
        subtitle_en: null,
        prompt: 'Maňa täze önüm üçin dörediji we özüne çekiji at we beýan ýaz.',
        sort_order: 3,
        is_active: true,
    },
    {
        emoji: '🔍',
        title_tk: 'Haryt gözle',
        title_ru: 'Найди товар',
        title_en: 'Search for a product',
        subtitle_tk: null,
        subtitle_ru: null,
        subtitle_en: null,
        prompt: 'Maňa gerek bolan harydyň adyny ýa-da beýanyny ýaz, men seniň üçin taparyn.',
        sort_order: 4,
        is_active: true,
    },
    {
        emoji: '📊',
        title_tk: 'Iň köp satylanlary analiz et',
        title_ru: 'Анализ самых продаваемых товаров',
        title_en: 'Analyse top-selling products',
        subtitle_tk: null,
        subtitle_ru: null,
        subtitle_en: null,
        prompt: 'Platformadaky iň köp satylýan 10 harydyň sanawy we sebäpleri barada maglumat ber.',
        sort_order: 5,
        is_active: true,
    },
    {
        emoji: '💡',
        title_tk: 'Bazr mümkinçiliklerini analiz et',
        title_ru: 'Анализ рыночных возможностей',
        title_en: 'Analyse market opportunities',
        subtitle_tk: null,
        subtitle_ru: null,
        subtitle_en: null,
        prompt: 'Türkmenistan bazarynda heniz doly öwrenilmedik we geljegi uly bolan iş mümkinçiliklerini aýt.',
        sort_order: 6,
        is_active: true,
    },
];

module.exports = async (db) => {
    console.log('  Checking existing AI recommendations…');

    const prompts = RECOMMENDATIONS.map(r => r.prompt);
    const existing = await db.AiRecommendation.findAll({
        where: { prompt: prompts },
        attributes: ['prompt'],
    });
    const existingSet = new Set(existing.map(r => r.prompt));

    const toInsert = RECOMMENDATIONS.filter(r => !existingSet.has(r.prompt));

    if (!toInsert.length) {
        console.log(`  Skipping: all ${RECOMMENDATIONS.length} AI recommendations already exist`);
        return;
    }

    await db.AiRecommendation.bulkCreate(toInsert);
    console.log(`  Done: ${toInsert.length} AI recommendation(s) created`);
    console.log('');
    console.log('  ┌────────────────────────────────────────────────────────────┐');
    toInsert.forEach(r => {
        const emoji = r.emoji ? `${r.emoji}  ` : '   ';
        console.log(`  │  ${emoji}${r.title_en}`);
    });
    console.log('  └────────────────────────────────────────────────────────────┘');
};
