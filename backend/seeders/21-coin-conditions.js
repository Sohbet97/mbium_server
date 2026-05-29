const CONDITIONS = [
    {
        name: 'Order Completed',
        source_event: 'ORDER_CLOSED',
        coins_amount: 1,
        multiplier_priority: 1.50,
        max_per_user_per_day: null,
        is_active: true,
    },
    {
        name: 'Write Review',
        source_event: 'REVIEW_WRITTEN',
        coins_amount: 10,
        multiplier_priority: 1.50,
        max_per_user_per_day: 5,
        is_active: true,
    },
    {
        name: 'Referral Signup',
        source_event: 'REFERRAL',
        coins_amount: 50,
        multiplier_priority: 2.00,
        max_per_user_per_day: 10,
        is_active: true,
    },
];

module.exports = async (db) => {
    console.log('  Seeding coin conditions...');
    let created = 0;
    for (const c of CONDITIONS) {
        const [, wasCreated] = await db.CoinCondition.findOrCreate({
            where: { source_event: c.source_event },
            defaults: c,
        });
        if (wasCreated) created++;
        else console.log(`    CoinCondition '${c.source_event}' already exists — skipping`);
    }
    console.log(`  Done: ${created} coin condition(s) created`);
};
