// Populates inventory_levels for each warehouse from the existing
// Product.stock and ProductVariant.stock values.
// Stock movements are also written so there is a visible audit trail.

module.exports = async (db) => {
    console.log('  Seeding inventory levels...');

    const existingLevels = await db.InventoryLevel.count();
    if (existingLevels > 0) {
        console.log(`  Skipping: ${existingLevels} inventory levels already exist`);
        return;
    }

    // Load all default warehouses keyed by shop_id
    const warehouses = await db.Warehouse.findAll({ where: { is_default: true } });
    if (!warehouses.length) {
        console.log('  Skipping: no warehouses found — run warehouses seeder first');
        return;
    }
    const warehouseByShop = Object.fromEntries(warehouses.map(w => [w.shop_id, w]));

    // Load all active products that track inventory
    const products = await db.Product.findAll({
        where: { track_inventory: true, is_active: true },
        attributes: ['id', 'shop_id', 'stock', 'name'],
        include: [{
            model: db.ProductVariant,
            as: 'variants',
            attributes: ['id', 'stock', 'name'],
            required: false,
            where: { is_active: true },
        }],
    });

    let levelCount = 0;
    let movementCount = 0;

    for (const product of products) {
        const warehouse = warehouseByShop[product.shop_id];
        if (!warehouse) continue;

        const variants = product.variants ?? [];

        if (variants.length === 0) {
            // Base product — use Product.stock
            const qty = Math.max(0, product.stock ?? 0);
            if (qty === 0) continue;

            await db.InventoryLevel.create({
                warehouse_id: warehouse.id,
                product_id:   product.id,
                variant_id:   null,
                quantity:     qty,
                reserved:     0,
            });
            levelCount++;

            await db.StockMovement.create({
                warehouse_id:    warehouse.id,
                product_id:      product.id,
                variant_id:      null,
                order_id:        null,
                type:            'INBOUND',
                quantity:        qty,
                quantity_before: 0,
                quantity_after:  qty,
                note:            'Initial stock from seeder',
                created_by:      null,
            });
            movementCount++;
        } else {
            // Has variants — use ProductVariant.stock for each
            for (const variant of variants) {
                const qty = Math.max(0, variant.stock ?? 0);
                if (qty === 0) continue;

                await db.InventoryLevel.create({
                    warehouse_id: warehouse.id,
                    product_id:   product.id,
                    variant_id:   variant.id,
                    quantity:     qty,
                    reserved:     0,
                });
                levelCount++;

                await db.StockMovement.create({
                    warehouse_id:    warehouse.id,
                    product_id:      product.id,
                    variant_id:      variant.id,
                    order_id:        null,
                    type:            'INBOUND',
                    quantity:        qty,
                    quantity_before: 0,
                    quantity_after:  qty,
                    note:            'Initial stock from seeder',
                    created_by:      null,
                });
                movementCount++;
            }
        }
    }

    console.log(`  Done: ${levelCount} inventory levels, ${movementCount} initial movements`);
};
