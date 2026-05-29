const db = require("../../../models");

const PRODUCT_ATTRS = ["id", "name", "track_inventory", "sell_when_out_of_stock", "stock"];
const VARIANT_ATTRS = ["id", "name", "stock"];

class InventoryService {
    static async getLevels(filter = {}, limit, skip = 0) {
        return db.InventoryLevel.findAll({
            where: filter,
            offset: skip,
            limit,
            order: [["updatedAt", "DESC"]],
            include: [
                { model: db.Product, as: "product", attributes: PRODUCT_ATTRS },
                { model: db.ProductVariant, as: "variant", attributes: VARIANT_ATTRS, required: false },
            ],
        });
    }

    static async getLevelsCount(filter = {}) {
        return db.InventoryLevel.count({ where: filter });
    }

    static async upsertLevel(warehouseId, productId, variantId, quantity) {
        const where = { warehouse_id: warehouseId, product_id: productId, variant_id: variantId ?? null };
        const [level] = await db.InventoryLevel.findOrCreate({
            where,
            defaults: { ...where, quantity, reserved: 0 },
        });
        if (level.quantity !== quantity) {
            await level.update({ quantity });
        }
        return level;
    }

    static async adjustStock(warehouseId, productId, variantId, qty, type, note, createdBy) {
        const t = await db.sequelize.transaction();
        try {
            const where = { warehouse_id: warehouseId, product_id: productId, variant_id: variantId ?? null };
            const [level] = await db.InventoryLevel.findOrCreate({
                where,
                defaults: { ...where, quantity: 0, reserved: 0 },
                transaction: t,
            });

            const before = level.quantity;
            let after;
            if (type === "OUTBOUND") {
                after = Math.max(0, before - qty);
            } else {
                after = before + qty;
            }

            await level.update({ quantity: after }, { transaction: t });

            await db.StockMovement.create({
                warehouse_id: warehouseId,
                product_id: productId,
                variant_id: variantId ?? null,
                type,
                quantity: qty,
                quantity_before: before,
                quantity_after: after,
                note: note ?? null,
                created_by: createdBy ?? null,
            }, { transaction: t });

            if (variantId) {
                const delta = type === "OUTBOUND" ? -Math.min(qty, before) : qty;
                await db.ProductVariant.increment("stock", { by: delta, where: { id: variantId }, transaction: t });
            } else {
                const delta = type === "OUTBOUND" ? -Math.min(qty, before) : qty;
                await db.Product.increment("stock", { by: delta, where: { id: productId }, transaction: t });
            }

            await t.commit();
            return level;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    static getFilter({ warehouse_id, product_id } = {}) {
        const filter = {};
        if (warehouse_id) filter.warehouse_id = warehouse_id;
        if (product_id) filter.product_id = product_id;
        return filter;
    }
}

module.exports = InventoryService;
