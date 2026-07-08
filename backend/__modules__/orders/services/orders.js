const { Op } = require("sequelize");
const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const ApiError = require("../../../exceptions/api-error");
const PayoutService = require("../../payouts/services/payouts");
const CoinService   = require("../../coins/services/CoinService");
const PushService   = require("../../../services/push");

const STATUS_CLOSED = 5;
const STATUS_PROCESSING = 2;

class OrderService {
    // Build where clause + optional customer include-where for search/date filters
    static _queryOpts(baseFilter = {}, { search, dateFrom, dateTo } = {}) {
        const where = { ...baseFilter };
        let customerWhere;

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
            if (dateTo) {
                const d = new Date(dateTo);
                d.setHours(23, 59, 59, 999);
                where.createdAt[Op.lte] = d;
            }
        }

        if (search) {
            const s = String(search).trim();
            if (s && !isNaN(s)) {
                where.id = Number(s);
            } else if (s) {
                const term = `%${s}%`;
                customerWhere = {
                    [Op.or]: [
                        { name:         { [Op.iLike]: term } },
                        { surname:      { [Op.iLike]: term } },
                        { phone_number: { [Op.like]:  term } },
                    ],
                };
            }
        }

        return { where, customerWhere };
    }

    static async get(filter = {}, limit, skip = 0, paranoid = true, opts = {}) {
        const { where, customerWhere } = this._queryOpts(filter, opts);
        return db.Order.findAll({
            where,
            offset: skip,
            order: [["createdAt", "DESC"]],
            limit,
            paranoid,
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"] },
                {
                    model: db.User, as: "customer",
                    attributes: ["id", "name", "surname", "phone_number"],
                    ...(customerWhere ? { where: customerWhere, required: true } : {}),
                },
            ],
        });
    }

    static async getCount(filter = {}, paranoid = true, opts = {}) {
        const { where, customerWhere } = this._queryOpts(filter, opts);
        return db.Order.count({
            where,
            paranoid,
            ...(customerWhere ? {
                include: [{ model: db.User, as: "customer", where: customerWhere, required: true }],
            } : {}),
        });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.Order.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name", "phone", "address"] },
                { model: db.User, as: "customer", attributes: ["id", "name", "surname", "phone_number"] },
                {
                    model: db.OrderItem,
                    as: "items",
                    include: [
                        { model: db.Product, as: "product", attributes: ["id", "name"] },
                        { model: db.ProductVariant, as: "variant", attributes: ["id", "name"], required: false },
                        {
                            model: db.ProductVariantSize, as: "variantSize", attributes: ["id", "sku"], required: false,
                            include: [{ model: db.Size, as: "size", attributes: ["id", "name"] }],
                        },
                    ],
                },
                { model: db.OrderStatusHistory, as: "status_history", order: [["createdAt", "DESC"]] },
                { model: db.PaymentTransaction, as: "payments" },
                { model: db.Shipment, as: "shipments", order: [["createdAt", "DESC"]] },
                { model: db.DeliveryAddress, as: "address", required: false },
            ],
        });
    }

    static async create(userId, body) {
        const { shop_id, delivery_address, delivery_address_id, note, items } = body;

        // Resolve prices/stock from DB to prevent client-side price tampering, including
        // variants/sizes so line items can price and validate against the actual purchasable unit.
        const productIds = items.map((i) => i.product_id);
        const products = await db.Product.findAll({
            where: { id: { [Op.in]: productIds } },
            include: [{
                model: db.ProductVariant,
                as: "variants",
                where: { is_active: true },
                required: false,
                include: [{ model: db.ProductVariantSize, as: "sizes", where: { is_active: true }, required: false }],
            }],
        });
        const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

        let total_price = 0;
        const resolvedItems = items.map((item) => {
            const product = productMap[item.product_id];
            if (!product) throw ApiError.BadRequest(`Haryt #${item.product_id} tapylmady`);

            // Resolve the effective purchasable unit: size (if the variant has sizes) -> variant -> bare product.
            const activeVariants = product.variants || [];
            let variant = null;
            let variantSize = null;

            if (activeVariants.length > 0) {
                if (!item.variant_id) throw ApiError.BadRequest(`"${product.name}" üçin wariant saýlaň`);
                variant = activeVariants.find((v) => v.id === Number(item.variant_id));
                if (!variant) throw ApiError.BadRequest(`"${product.name}" üçin wariant tapylmady`);

                const sizes = variant.sizes || [];
                if (sizes.length > 0) {
                    if (!item.variant_size_id) throw ApiError.BadRequest(`"${product.name}" üçin ölçegi saýlaň`);
                    variantSize = sizes.find((s) => s.id === Number(item.variant_size_id));
                    if (!variantSize) throw ApiError.BadRequest(`"${product.name}" üçin ölçeg tapylmady`);
                }
            }

            const effectiveStock = variantSize ? variantSize.stock : variant ? variant.stock : product.stock;
            if (!product.sell_when_out_of_stock && effectiveStock < item.quantity) {
                throw ApiError.BadRequest(
                    `"${product.name}" üçin ýeterlik stok ýok (bar: ${effectiveStock}, gerek: ${item.quantity})`
                );
            }

            const unit_price = parseFloat(variantSize?.price ?? variant?.price ?? product.price);
            const total = unit_price * item.quantity;
            total_price += total;
            return {
                product_id: item.product_id,
                variant_id: variant?.id ?? null,
                variant_size_id: variantSize?.id ?? null,
                product_name: product.name,
                quantity: item.quantity,
                unit_price,
                total_price: total,
            };
        });

        const order = await db.Order.create(
            {
                user_id: userId,
                shop_id,
                total_price,
                currency: products[0]?.currency || "TMT",
                delivery_address,
                delivery_address_id: delivery_address_id || null,
                note,
                status: 0,
                items: resolvedItems,
            },
            { include: [{ model: db.OrderItem, as: "items" }] }
        );

        await db.OrderStatusHistory.create({ order_id: order.id, status: 0, changed_by: userId });
        PushService.onOrderCreated(order).catch(() => {});
        return order;
    }

    static async updateStatus(orderId, status, note, changedBy) {
        await db.Order.update({ status }, { where: { id: orderId } });
        await db.OrderStatusHistory.create({ order_id: orderId, status, note, changed_by: changedBy });
        if (status === STATUS_PROCESSING) {
            await this._deductInventory(orderId, changedBy);
        }

        // Fetch order once for both coin award and push notification
        const order = await db.Order.findOne({ where: { id: orderId }, attributes: ["id", "user_id", "shop_id", "total_price"] });
        if (order) {
            if (status === STATUS_CLOSED) {
                await this._applyCommission(orderId);
                await CoinService.awardForOrder(order);
                this._incrementSoldCount(orderId).catch(() => {});
            }
            PushService.onOrderStatusChanged(orderId, order.user_id, order.shop_id, status).catch(() => {});
        }
    }

    static async _deductInventory(orderId, changedBy) {
        const order = await db.Order.findOne({
            where: { id: orderId },
            include: [{
                model: db.OrderItem,
                as: "items",
                include: [
                    { model: db.Product, as: "product", attributes: ["id", "name", "track_inventory", "sell_when_out_of_stock", "stock"] },
                    { model: db.ProductVariant, as: "variant", required: false, attributes: ["id", "stock"] },
                    { model: db.ProductVariantSize, as: "variantSize", required: false, attributes: ["id", "stock"] },
                ],
            }],
        });
        if (!order) return;

        const warehouse = await db.Warehouse.findOne({
            where: { shop_id: order.shop_id, is_default: true, is_active: true },
        });
        if (!warehouse) return;

        const t = await db.sequelize.transaction();
        try {
            for (const item of order.items) {
                const product = item.product;
                if (!product || !product.track_inventory) continue;

                const productId = item.product_id;
                const variantId = item.variant_id ?? null;
                const variantSizeId = item.variant_size_id ?? null;
                const qty = item.quantity;

                const levelWhere = { warehouse_id: warehouse.id, product_id: productId, variant_id: variantId, variant_size_id: variantSizeId };
                const [level] = await db.InventoryLevel.findOrCreate({
                    where: levelWhere,
                    defaults: { ...levelWhere, quantity: 0, reserved: 0 },
                    transaction: t,
                });

                const before = level.quantity;
                if (before < qty && !product.sell_when_out_of_stock) {
                    throw ApiError.BadRequest(
                        `Ammar: "${product.name}" üçin ýeterlik stok ýok (bar: ${before}, gerek: ${qty})`
                    );
                }
                const after = Math.max(0, before - qty);

                await level.update({ quantity: after }, { transaction: t });

                await db.StockMovement.create({
                    warehouse_id: warehouse.id,
                    product_id: productId,
                    variant_id: variantId,
                    variant_size_id: variantSizeId,
                    order_id: orderId,
                    type: "OUTBOUND",
                    quantity: qty,
                    quantity_before: before,
                    quantity_after: after,
                    note: `Order #${orderId} processing`,
                    created_by: changedBy ?? null,
                }, { transaction: t });

                const deductBy = Math.min(qty, before);
                if (variantSizeId) {
                    await db.ProductVariantSize.decrement("stock", { by: deductBy, where: { id: variantSizeId }, transaction: t });
                } else if (variantId) {
                    await db.ProductVariant.decrement("stock", { by: deductBy, where: { id: variantId }, transaction: t });
                } else {
                    await db.Product.decrement("stock", { by: deductBy, where: { id: productId }, transaction: t });
                }
            }
            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    static async _applyCommission(orderId) {
        const order = await db.Order.findOne({
            where: { id: orderId },
            attributes: ["shop_id", "total_price"],
            include: [
                {
                    model: db.Shop,
                    as: "shop",
                    attributes: ["id", "plan_id"],
                    include: [{ model: db.Plan, as: "plan", attributes: ["commission_rate"] }],
                },
            ],
        });
        if (!order) return;

        // Use plan-level commission rate; fall back to global config
        let rate = order.shop?.plan?.commission_rate;
        if (rate == null) {
            const config = await db.Config.findOne();
            rate = config?.platform_commission_rate ?? 0.15;
        }
        rate = Math.min(1, Math.max(0, parseFloat(rate)));

        const platformFee = parseFloat((parseFloat(order.total_price) * rate).toFixed(2));
        const sellerAmount = parseFloat((parseFloat(order.total_price) - platformFee).toFixed(2));

        if (sellerAmount > 0) {
            await PayoutService.creditBalance(order.shop_id, sellerAmount);
        }
    }

    static async _incrementSoldCount(orderId) {
        const items = await db.OrderItem.findAll({ where: { order_id: orderId }, attributes: ['product_id', 'quantity'] });
        for (const item of items) {
            await db.Product.increment('sold_count', { by: item.quantity, where: { id: item.product_id } });
        }
    }

    static async delete(id, force = false) {
        return db.Order.destroy({ where: { id }, force });
    }

    static async addPayment(orderId, data) {
        return db.PaymentTransaction.create({ order_id: orderId, ...data });
    }

    static async getShipments(orderId) {
        return db.Shipment.findAll({
            where: { order_id: orderId },
            order: [["createdAt", "DESC"]],
        });
    }

    static async addShipment(orderId, data) {
        return db.Shipment.create({ order_id: orderId, ...data });
    }

    static async updateShipment(shipmentId, data) {
        await db.Shipment.update(data, { where: { id: shipmentId } });
        return db.Shipment.findOne({ where: { id: shipmentId } });
    }

    static async deleteShipment(shipmentId) {
        return db.Shipment.destroy({ where: { id: shipmentId } });
    }

    static async updateItem(orderId, itemId, quantity) {
        const item = await db.OrderItem.findOne({ where: { id: itemId, order_id: orderId } });
        if (!item) throw ApiError.NotFound('Haryt tapylmady');
        const newItemTotal = parseFloat((parseFloat(item.unit_price) * quantity).toFixed(2));
        await item.update({ quantity, total_price: newItemTotal });
        await this._recalcOrderTotal(orderId);
        return item;
    }

    static async deleteItem(orderId, itemId) {
        const count = await db.OrderItem.count({ where: { order_id: orderId } });
        if (count <= 1) throw ApiError.BadRequest('Iň az bir haryt bolmaly');
        await db.OrderItem.destroy({ where: { id: itemId, order_id: orderId } });
        await this._recalcOrderTotal(orderId);
    }

    static async _recalcOrderTotal(orderId) {
        const items = await db.OrderItem.findAll({ where: { order_id: orderId } });
        const total = parseFloat(
            items.reduce((sum, i) => sum + parseFloat(i.total_price), 0).toFixed(2)
        );
        await db.Order.update({ total_price: total }, { where: { id: orderId } });
    }
}

module.exports = OrderService;
