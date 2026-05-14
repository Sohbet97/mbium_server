const { DataTypes } = require("sequelize");

const PAYMENT_STATUSES = {
    PENDING: 0,
    SUCCESS: 1,
    FAILED: 2,
    REFUNDED: 3,
};

const PAYMENT_METHODS = {
    CASH: "CASH",
    CARD: "CARD",
    BANK_TRANSFER: "BANK_TRANSFER",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("payment_transactions", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "orders", key: "id" },
            onDelete: "RESTRICT"
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: "TMT"
        },
        method: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: PAYMENT_METHODS.CASH
        },
        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: PAYMENT_STATUSES.PENDING
        },
        external_id: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        paid_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ["order_id"] },
            { fields: ["status"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });
    };

    return Model;
};
