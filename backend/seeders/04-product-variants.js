// Variants keyed by product SKU. Each entry is an array of variant definitions.
const VARIANT_DEFS = {
    'SGA54-128': [
        { name: 'Syýah / 128GB',  sku: 'SGA54-128-BLK', price: 1590.00, stock: 20, attributes: { color: 'Syýah',  color_en: 'Black',  hex: '#1a1a1a', storage: '128GB' } },
        { name: 'Ak / 128GB',     sku: 'SGA54-128-WHT', price: 1590.00, stock: 20, attributes: { color: 'Ak',     color_en: 'White',  hex: '#f5f5f5', storage: '128GB' } },
        { name: 'Mawy / 128GB',   sku: 'SGA54-128-BLU', price: 1590.00, stock: 10, attributes: { color: 'Mawy',   color_en: 'Blue',   hex: '#2a5298', storage: '128GB' } },
        { name: 'Syýah / 256GB',  sku: 'SGA54-256-BLK', price: 1790.00, stock: 10, attributes: { color: 'Syýah',  color_en: 'Black',  hex: '#1a1a1a', storage: '256GB' } },
        { name: 'Mawy / 256GB',   sku: 'SGA54-256-BLU', price: 1790.00, stock: 5,  attributes: { color: 'Mawy',   color_en: 'Blue',   hex: '#2a5298', storage: '256GB' } },
    ],
    'IP15-128': [
        { name: 'Gara / 128GB',   sku: 'IP15-128-BLK',  price: 4200.00, stock: 8,  attributes: { color: 'Gara',   color_en: 'Black',  hex: '#000000', storage: '128GB' } },
        { name: 'Ak / 128GB',     sku: 'IP15-128-WHT',  price: 4200.00, stock: 6,  attributes: { color: 'Ak',     color_en: 'White',  hex: '#f5f5f5', storage: '128GB' } },
        { name: 'Ýaşyl / 128GB',  sku: 'IP15-128-GRN',  price: 4200.00, stock: 4,  attributes: { color: 'Ýaşyl',  color_en: 'Green',  hex: '#22c55e', storage: '128GB' } },
        { name: 'Gara / 256GB',   sku: 'IP15-256-BLK',  price: 4850.00, stock: 5,  attributes: { color: 'Gara',   color_en: 'Black',  hex: '#000000', storage: '256GB' } },
        { name: 'Ak / 256GB',     sku: 'IP15-256-WHT',  price: 4850.00, stock: 3,  attributes: { color: 'Ak',     color_en: 'White',  hex: '#f5f5f5', storage: '256GB' } },
    ],
    'XRN13-128': [
        { name: 'Gara / 128GB',   sku: 'XRN13-128-BLK', price: 990.00,  stock: 30, attributes: { color: 'Gara',   color_en: 'Black',  hex: '#000000', storage: '128GB' } },
        { name: 'Kümüş / 128GB',  sku: 'XRN13-128-SLV', price: 990.00,  stock: 25, attributes: { color: 'Kümüş',  color_en: 'Silver', hex: '#c0c0c0', storage: '128GB' } },
        { name: 'Mawy / 256GB',   sku: 'XRN13-256-BLU', price: 1150.00, stock: 15, attributes: { color: 'Mawy',   color_en: 'Blue',   hex: '#2a5298', storage: '256GB' } },
    ],
    'LIP5-R5': [
        { name: 'Ryzen 5 / 8GB / 512GB',  sku: 'LIP5-R5-8-512',  price: 3800.00, stock: 10, attributes: { processor: 'AMD Ryzen 5 5500U', ram: '8GB',  storage: '512GB SSD' } },
        { name: 'Ryzen 5 / 16GB / 512GB', sku: 'LIP5-R5-16-512', price: 4400.00, stock: 5,  attributes: { processor: 'AMD Ryzen 5 5500U', ram: '16GB', storage: '512GB SSD' } },
    ],
    'AVB15-I5': [
        { name: 'Core i5 / 16GB / 512GB', sku: 'AVB15-I5-16-512', price: 4100.00, stock: 7,  attributes: { processor: 'Intel Core i5-1235U', ram: '16GB', storage: '512GB SSD' } },
        { name: 'Core i5 / 16GB / 1TB',   sku: 'AVB15-I5-16-1T',  price: 4700.00, stock: 3,  attributes: { processor: 'Intel Core i5-1235U', ram: '16GB', storage: '1TB SSD' } },
    ],
    'SWH1KXM5': [
        { name: 'Syýah',  sku: 'SWH1KXM5-BLK', price: 1250.00, stock: 15, attributes: { color: 'Syýah',  color_en: 'Black',  hex: '#1a1a1a' } },
        { name: 'Kümüş', sku: 'SWH1KXM5-SLV', price: 1250.00, stock: 10, attributes: { color: 'Kümüş', color_en: 'Silver', hex: '#c0c0c0' } },
    ],
    'MJ-SLIM-BL': [
        { name: 'S',   sku: 'MJ-SLIM-BL-S',   price: 280.00, stock: 25, attributes: { size: 'S' } },
        { name: 'M',   sku: 'MJ-SLIM-BL-M',   price: 280.00, stock: 30, attributes: { size: 'M' } },
        { name: 'L',   sku: 'MJ-SLIM-BL-L',   price: 280.00, stock: 25, attributes: { size: 'L' } },
        { name: 'XL',  sku: 'MJ-SLIM-BL-XL',  price: 280.00, stock: 15, attributes: { size: 'XL' } },
        { name: 'XXL', sku: 'MJ-SLIM-BL-XXL', price: 280.00, stock: 5,  attributes: { size: 'XXL' } },
    ],
    'MP-POLO-01': [
        { name: 'Ak / S',      sku: 'MP-POLO-WHT-S',  price: 145.00, stock: 20, attributes: { color: 'Ak',    color_en: 'White', hex: '#ffffff', size: 'S' } },
        { name: 'Ak / M',      sku: 'MP-POLO-WHT-M',  price: 145.00, stock: 30, attributes: { color: 'Ak',    color_en: 'White', hex: '#ffffff', size: 'M' } },
        { name: 'Ak / L',      sku: 'MP-POLO-WHT-L',  price: 145.00, stock: 25, attributes: { color: 'Ak',    color_en: 'White', hex: '#ffffff', size: 'L' } },
        { name: 'Laçyn / M',   sku: 'MP-POLO-NAV-M',  price: 145.00, stock: 25, attributes: { color: 'Laçyn', color_en: 'Navy',  hex: '#1e3a5f', size: 'M' } },
        { name: 'Laçyn / L',   sku: 'MP-POLO-NAV-L',  price: 145.00, stock: 20, attributes: { color: 'Laçyn', color_en: 'Navy',  hex: '#1e3a5f', size: 'L' } },
        { name: 'Gyzyl / M',   sku: 'MP-POLO-RED-M',  price: 145.00, stock: 15, attributes: { color: 'Gyzyl', color_en: 'Red',   hex: '#ef4444', size: 'M' } },
    ],
    'NAM270': [
        { name: '40', sku: 'NAM270-40', price: 450.00, stock: 8, attributes: { size: '40' } },
        { name: '41', sku: 'NAM270-41', price: 450.00, stock: 8, attributes: { size: '41' } },
        { name: '42', sku: 'NAM270-42', price: 450.00, stock: 8, attributes: { size: '42' } },
        { name: '43', sku: 'NAM270-43', price: 450.00, stock: 8, attributes: { size: '43' } },
        { name: '44', sku: 'NAM270-44', price: 450.00, stock: 5, attributes: { size: '44' } },
        { name: '45', sku: 'NAM270-45', price: 450.00, stock: 3, attributes: { size: '45' } },
    ],
    'FB-SMART': [
        { name: 'Syýah', sku: 'FB-SMART-BLK', price: 175.00, stock: 25, attributes: { color: 'Syýah', color_en: 'Black', hex: '#1a1a1a' } },
        { name: 'Ýaşyl', sku: 'FB-SMART-GRN', price: 175.00, stock: 20, attributes: { color: 'Ýaşyl', color_en: 'Green', hex: '#22c55e' } },
        { name: 'Gyzyl', sku: 'FB-SMART-RED', price: 175.00, stock: 15, attributes: { color: 'Gyzyl', color_en: 'Red',   hex: '#ef4444' } },
    ],
    'LOP-SH400': [
        { name: '200ml', sku: 'LOP-SH-200', price: 22.00, stock: 80, attributes: { volume: '200ml' } },
        { name: '400ml', sku: 'LOP-SH-400', price: 38.00, stock: 80, attributes: { volume: '400ml' } },
        { name: '750ml', sku: 'LOP-SH-750', price: 62.00, stock: 40, attributes: { volume: '750ml' } },
    ],
};

module.exports = async (db) => {
    console.log('  Seeding product variants...');

    const existing = await db.ProductVariant.count();
    if (existing > 0) {
        console.log(`  Skipping: ${existing} variants already exist`);
        return;
    }

    const products = await db.Product.findAll({
        where: { sku: Object.keys(VARIANT_DEFS) },
        attributes: ['id', 'sku'],
    });

    if (!products.length) {
        console.log('  Skipping: no matching products found');
        return;
    }

    const variants = [];
    products.forEach((product) => {
        const defs = VARIANT_DEFS[product.sku];
        if (!defs) return;
        defs.forEach(def => variants.push({ ...def, product_id: product.id, is_active: true }));
    });

    await db.ProductVariant.bulkCreate(variants);
    console.log(`  Done: ${variants.length} variants for ${products.length} products`);
};
