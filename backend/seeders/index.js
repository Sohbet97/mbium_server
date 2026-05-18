const catalogDb = require('./db');         // lightweight: catalog + shops only
const fullDb    = require('../models');     // full model registry (Role, User, …)

async function run() {
    try {
        await catalogDb.sequelize.authenticate();
        console.log('Database connected.\n');

        console.log('[0/11] Superadmin role & user');
        await require('./00-superadmin')(fullDb);

        console.log('\n[1/11] Shop Types');
        await require('./05-shop-types')(catalogDb);

        console.log('\n[2/11] Shops');
        await require('./06-shops')(catalogDb);

        console.log('\n[3/11] Categories');
        await require('./01-categories')(catalogDb);

        console.log('\n[4/11] Products');
        await require('./02-products')(catalogDb);

        console.log('\n[5/11] Product Images');
        await require('./03-product-images')(catalogDb);

        console.log('\n[6/11] Product Variants');
        await require('./04-product-variants')(catalogDb);

        console.log('\n[7/11] Customer Users');
        await require('./07-users')(fullDb);

        console.log('\n[8/11] Orders');
        await require('./08-orders')(fullDb);

        console.log('\n[9/11] Reviews');
        await require('./09-reviews')(fullDb);

        console.log('\n[10/11] Discounts');
        await require('./10-discounts')(fullDb);

        console.log('\n[11/11] Notifications');
        await require('./11-notifications')(fullDb);

        console.log('\n[12/12] Banner Types');
        await require('./12-banner-types')(fullDb);

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
