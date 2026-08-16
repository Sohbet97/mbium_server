const { DataTypes } = require("sequelize");

const ORDER_STATUSES = {
    PENDING: 0,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    CLOSED: 5,
    CANCELLED: 10,
    REFUNDED: 11,
};

module.exports = (sequelize) => {
    const Model = sequelize.define("orders", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "RESTRICT"
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "shops", key: "id" },
            onDelete: "RESTRICT"
        },
        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: ORDER_STATUSES.PENDING
        },
        total_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: "TMT"
        },
        delivery_address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        delivery_address_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "delivery_addresses", key: "id" },
            onDelete: "SET NULL",
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        discount_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "discounts", key: "id" },
            onDelete: "SET NULL",
        },
        discount_code: {
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        discount_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        }
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["user_id"] },
            { fields: ["shop_id"] },
            { fields: ["status"] },
            { fields: ["createdAt"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "customer" });
        Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        if (db.Discount) {
            Model.belongsTo(db.Discount, { foreignKey: "discount_id", as: "discount" });
        }
        Model.hasMany(db.OrderItem, { foreignKey: "order_id", as: "items" });
        Model.hasMany(db.OrderStatusHistory, { foreignKey: "order_id", as: "status_history" });
        Model.hasMany(db.PaymentTransaction, { foreignKey: "order_id", as: "payments" });
        Model.hasMany(db.Shipment, { foreignKey: "order_id", as: "shipments" });
        if (db.DeliveryAddress) {
            Model.belongsTo(db.DeliveryAddress, { foreignKey: "delivery_address_id", as: "address" });
        }
    };

    return Model;
};
