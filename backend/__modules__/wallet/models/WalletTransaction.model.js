const { DataTypes } = require("sequelize");

const WALLET_CURRENCIES = {
    TMT: "TMT",
    COIN: "COIN",
};

const WALLET_TRANSACTION_STATUSES = {
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("wallet_transactions", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "shops", key: "id" },
            onDelete: "SET NULL",
        },
        feature: {
            type: DataTypes.STRING(50),
            allowNull: false,
            // e.g. TURBO_BOOST
        },
        reference_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            // TMT | COIN
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: WALLET_TRANSACTION_STATUSES.COMPLETED,
        },
        coin_transaction_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "coin_transactions", key: "id" },
            onDelete: "SET NULL",
        },
        seller_transaction_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "seller_transactions", key: "id" },
            onDelete: "SET NULL",
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { fields: ["user_id"] },
            { fields: ["shop_id"] },
            { fields: ["feature"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
        if (db.Shop) Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        Model.belongsTo(db.CoinTransaction, { foreignKey: "coin_transaction_id", as: "coin_transaction" });
        Model.belongsTo(db.SellerTransaction, { foreignKey: "seller_transaction_id", as: "seller_transaction" });
    };

    return Model;
};

module.exports.WALLET_CURRENCIES = WALLET_CURRENCIES;
module.exports.WALLET_TRANSACTION_STATUSES = WALLET_TRANSACTION_STATUSES;
