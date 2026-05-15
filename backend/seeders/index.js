const catalogDb = require('./db');         // lightweight: catalog + shops only
const fullDb    = require('../models');     // full model registry (Role, User, …)

async function run() {
    try {
        await catalogDb.sequelize.authenticate();
        console.log('Database connected.\n');

        console.log('[0/7] Superadmin role & user');
        await require('./00-superadmin')(fullDb);

        console.log('\n[1/7] Shop Types');
        await require('./05-shop-types')(catalogDb);

        console.log('\n[2/7] Shops');
        await require('./06-shops')(catalogDb);

        console.log('\n[3/7] Categories');
        await require('./01-categories')(catalogDb);

        console.log('\n[4/7] Products');
        await require('./02-products')(catalogDb);

        console.log('\n[5/7] Product Images');
        await require('./03-product-images')(catalogDb);

        console.log('\n[6/7] Product Variants');
        await require('./04-product-variants')(catalogDb);

        console.log('\nAll seeds complete.');
    } catch (err) {
        console.error('\nSeeding failed:', err.message);
        process.exit(1);
    } finally {
        await catalogDb.sequelize.close();
    }
}

run();
