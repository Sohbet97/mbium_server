// Uses picsum.photos with a deterministic seed per product so images are stable across runs
const BASE = 'https://picsum.photos/seed';

module.exports = async (db) => {
    console.log('  Seeding product images...');

    const existing = await db.ProductImage.count();
    if (existing > 0) {
        console.log(`  Skipping: ${existing} product images already exist`);
        return;
    }

    const products = await db.Product.findAll({
        attributes: ['id', 'sku'],
        order: [['id', 'ASC']],
    });

    if (!products.length) {
        console.log('  Skipping: no products found');
        return;
    }

    const images = [];
    products.forEach((product) => {
        const seed = (product.sku || `prod${product.id}`).replace(/[^a-zA-Z0-9]/g, '');
        images.push(
            { product_id: product.id, url: `${BASE}/${seed}1/800/800`, is_primary: true,  order: 1 },
            { product_id: product.id, url: `${BASE}/${seed}2/800/800`, is_primary: false, order: 2 },
            { product_id: product.id, url: `${BASE}/${seed}3/800/800`, is_primary: false, order: 3 },
        );
    });

    await db.ProductImage.bulkCreate(images);
    console.log(`  Done: ${images.length} images for ${products.length} products`);
};
