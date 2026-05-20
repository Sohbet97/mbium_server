const catalogDb = require('./db');         // lightweight: catalog + shops only
const fullDb    = require('../models');     // full model registry (Role, User, …)

async function run() {
    try {
        await catalogDb.sequelize.authenticate();
        console.log('Database connected.\n');

        console.log('[0/16] Superadmin role & user');
        await require('./00-superadmin')(fullDb);

        console.log('\n[1/16] Locations (country, regions, cities, districts, villages)');
        await require('./16-locations')(fullDb);

        console.log('\n[2/16] Shop Types');
        await require('./05-shop-types')(catalogDb);

        console.log('\n[3/16] Shops');
        await require('./06-shops')(catalogDb);

        console.log('\n[4/16] Categories');
        await require('./01-categories')(catalogDb);

        console.log('\n[5/16] Products');
        await require('./02-products')(catalogDb);

        console.log('\n[6/16] Product Images');
        await require('./03-product-images')(catalogDb);

        console.log('\n[7/16] Product Variants');
        await require('./04-product-variants')(catalogDb);

        console.log('\n[8/16] Customer Users');
        await require('./07-users')(fullDb);

        console.log('\n[9/16] Orders');
        await require('./08-orders')(fullDb);

        console.log('\n[10/16] Reviews');
        await require('./09-reviews')(fullDb);

        console.log('\n[11/16] Discounts');
        await require('./10-discounts')(fullDb);

        console.log('\n[12/16] Notifications');
        await require('./11-notifications')(fullDb);

        console.log('\n[13/16] Banner Types');
        await require('./12-banner-types')(fullDb);

        console.log('\n[14/16] Subscription Plans');
        await require('./13-plans')(fullDb);

        console.log('\n[15/16] Delivers');
        await require('./14-delivers')(fullDb);

        console.log('\n[16/16] Collections');
        await require('./15-collections')(fullDb);

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
