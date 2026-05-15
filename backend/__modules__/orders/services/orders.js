const { Op } = require("sequelize");
const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const ApiError = require("../../../exceptions/api-error");
const PayoutService = require("../../payouts/services/payouts");

const STATUS_CLOSED = 5;

class OrderService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.Order.findAll({
            where: filter,
            offset: skip,
            order: [["createdAt", "DESC"]],
            limit,
            paranoid,
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"] },
                { model: db.User, as: "customer", attributes: ["id", "name", "surname", "phone_number"] },
            ],
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Order.count({ where: filter, paranoid });
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

        // Resolve prices from DB to prevent client-side price tampering
        const productIds = items.map((i) => i.product_id);
        const products = await db.Product.findAll({ where: { id: { [Op.in]: productIds } } });
        const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

        let total_price = 0;
        const resolvedItems = items.map((item) => {
            const product = productMap[item.product_id];
            if (!product) throw ApiError.BadRequest(`Haryt #${item.product_id} tapylmady`);
            const unit_price = parseFloat(product.price);
            const total = unit_price * item.quantity;
            total_price += total;
            return {
                product_id: item.product_id,
                variant_id: item.variant_id || null,
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
        return order;
    }

    static async updateStatus(orderId, status, note, changedBy) {
        await db.Order.update({ status }, { where: { id: orderId } });
        await db.OrderStatusHistory.create({ order_id: orderId, status, note, changed_by: changedBy });
        if (status === STATUS_CLOSED) {
            await this._applyCommission(orderId);
        }
    }

    static async _applyCommission(orderId) {
        const order = await db.Order.findOne({
            where: { id: orderId },
            attributes: ["shop_id", "total_price"],
        });
        if (!order) return;

        const config = await db.Config.findOne();
        const rate = Math.min(1, Math.max(0, parseFloat(config?.platform_commission_rate ?? 0)));
        const platformFee = parseFloat((parseFloat(order.total_price) * rate).toFixed(2));
        const sellerAmount = parseFloat((parseFloat(order.total_price) - platformFee).toFixed(2));

        if (sellerAmount > 0) {
            await PayoutService.creditBalance(order.shop_id, sellerAmount);
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
}

module.exports = OrderService;
