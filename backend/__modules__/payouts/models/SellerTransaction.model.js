const { DataTypes } = require("sequelize");

const SELLER_TRANSACTION_TYPES = {
    ORDER_CREDIT: "ORDER_CREDIT",
    COMMISSION: "COMMISSION",
    PAYOUT_DEBIT: "PAYOUT_DEBIT",
    PAYOUT_REVERSAL: "PAYOUT_REVERSAL",
};

const SELLER_TRANSACTION_STATUSES = {
    PENDING: "PENDING",
    AVAILABLE: "AVAILABLE",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("seller_transactions", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "shops", key: "id" },
            onDelete: "RESTRICT",
        },
        type: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            // positive = credit, negative = debit
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: SELLER_TRANSACTION_STATUSES.AVAILABLE,
        },
        available_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "orders", key: "id" },
            onDelete: "SET NULL",
        },
        payout_request_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "payout_requests", key: "id" },
            onDelete: "SET NULL",
        },
        balance_after: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { fields: ["shop_id"] },
            { fields: ["status"] },
            { fields: ["order_id"] },
        ],
    });

    Model.associate = (db) => {
        if (db.Shop) {
            Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        }
        if (db.Order) {
            Model.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });
        }
        if (db.PayoutRequest) {
            Model.belongsTo(db.PayoutRequest, { foreignKey: "payout_request_id", as: "payout_request" });
        }
    };

    return Model;
};

module.exports.SELLER_TRANSACTION_TYPES = SELLER_TRANSACTION_TYPES;
module.exports.SELLER_TRANSACTION_STATUSES = SELLER_TRANSACTION_STATUSES;
