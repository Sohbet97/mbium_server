const catalogDb = require('./db');         // lightweight: catalog + shops only
const fullDb    = require('../models');     // full model registry (Role, User, …)

async function run() {
    try {
        await catalogDb.sequelize.authenticate();
        console.log('Database connected.\n');

        console.log('[1/17] Superadmin role & user');
        await require('./00-superadmin')(fullDb);

        console.log('\n[2/17] System roles (admin, moderator, content_manager, delivery_manager)');
        await require('./01-system-roles')(fullDb);

        console.log('\n[3/17] Locations (country, regions, cities, districts, villages)');
        await require('./16-locations')(fullDb);

        console.log('\n[4/17] Shop Types');
        await require('./05-shop-types')(catalogDb);

        console.log('\n[5/17] Shops');
        await require('./06-shops')(catalogDb);

        console.log('\n[6/17] Categories');
        await require('./01-categories')(catalogDb);

        console.log('\n[7/17] Products');
        await require('./02-products')(catalogDb);

        console.log('\n[8/17] Product Images');
        await require('./03-product-images')(catalogDb);

        console.log('\n[9/17] Product Variants');
        await require('./04-product-variants')(catalogDb);

        console.log('\n[10/17] Customer Users');
        await require('./07-users')(fullDb);

        console.log('\n[11/17] Orders');
        await require('./08-orders')(fullDb);

        console.log('\n[12/17] Reviews');
        await require('./09-reviews')(fullDb);

        console.log('\n[13/17] Discounts');
        await require('./10-discounts')(fullDb);

        console.log('\n[14/17] Notifications');
        await require('./11-notifications')(fullDb);

        console.log('\n[15/17] Banner Types');
        await require('./12-banner-types')(fullDb);

        console.log('\n[16/19] Subscription Plans');
        await require('./13-plans')(fullDb);

        console.log('\n[17/19] Delivers');
        await require('./14-delivers')(fullDb);

        console.log('\n[18/19] Collections');
        await require('./15-collections')(fullDb);

        console.log('\n[19/19] Test shop applications');
        await require('./17-shop-applications')(fullDb);

        console.log('\nAll seeds complete.');
    } catch (err) {
        console.error('\nSeeding failed:', err.message);
        process.exit(1);
    } finally {
        await catalogDb.sequelize.close();
        await fullDb.sequelize.close();
    }
}

run();
