/**
 * Seeder: Subscription Plans (Basic / VIP / Premium)
 * Idempotent — uses findOrCreate on the unique `name` column.
 */

const PLANS = [
    {
        name:                 'basic',
        display_name_tm:      'Sada',
        display_name_ru:      'Базовый',
        display_name_en:      'Basic',
        price_monthly:        0,
        commission_rate:      0.15,
        product_limit:        50,
        hotspot_per_month:    0,
        hotspot_duration_hrs: 0,
        ai_credits_monthly:   5,
        auction_per_week:     0,
        live_stream_mode:     1,   // view-only
        ads_dashboard:        false,
        coin_earn:            false,
        coin_earn_priority:   false,
        revenue_share_user:   0,
        verified_badge:       false,
        virtual_tour:         false,
        oem_odm_support:      false,
        push_notif_monthly:   0,
        is_active:            true,
        sort_order:           1,
    },
    {
        name:                 'vip',
        display_name_tm:      'VIP',
        display_name_ru:      'VIP',
        display_name_en:      'VIP',
        price_monthly:        200,
        commission_rate:      0.09,
        product_limit:        null,
        hotspot_per_month:    2,
        hotspot_duration_hrs: 24,
        ai_credits_monthly:   50,
        auction_per_week:     1,
        live_stream_mode:     2,   // limited
        ads_dashboard:        true,
        coin_earn:            true,
        coin_earn_priority:   false,
        revenue_share_user:   50,
        verified_badge:       false,
        virtual_tour:         false,
        oem_odm_support:      false,
        push_notif_monthly:   1,
        is_active:            true,
        sort_order:           2,
    },
    {
        name:                 'premium',
        display_name_tm:      'Premium (Verified PRO)',
        display_name_ru:      'Премиум (Verified PRO)',
        display_name_en:      'Premium (Verified PRO)',
        price_monthly:        500,
        commission_rate:      0.05,
        product_limit:        null,
        hotspot_per_month:    5,
        hotspot_duration_hrs: 48,
        ai_credits_monthly:   200,
        auction_per_week:     null,  // unlimited
        live_stream_mode:     3,     // unlimited
        ads_dashboard:        true,
        coin_earn:            true,
        coin_earn_priority:   true,
        revenue_share_user:   60,
        verified_badge:       true,
        virtual_tour:         true,
        oem_odm_support:      true,
        push_notif_monthly:   4,
        is_active:            true,
        sort_order:           3,
    },
];

module.exports = async (db) => {
    console.log('  Seeding subscription plans...');

    let created = 0;
    for (const plan of PLANS) {
        const [, wasCreated] = await db.Plan.findOrCreate({
            where: { name: plan.name },
            defaults: plan,
        });
        if (wasCreated) created++;
        else console.log(`  Plan '${plan.name}' already exists — skipping`);
    }

    if (created > 0) console.log(`  Done: ${created} plans created`);
};
