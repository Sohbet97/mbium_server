const { DataTypes } = require("sequelize");

const TURBO_BOOST_STATUSES = {
    ACTIVE: "ACTIVE",
    EXPIRED: "EXPIRED",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("product_turbo_boosts", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
            onDelete: "CASCADE",
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "shops", key: "id" },
            onDelete: "CASCADE",
        },
        package_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "turbo_packages", key: "id" },
        },
        tier_hours: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
        started_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        next_refresh_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: TURBO_BOOST_STATUSES.ACTIVE,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            // TMT | COIN
        },
        paid_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        wallet_transaction_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "wallet_transactions", key: "id" },
            onDelete: "SET NULL",
        },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { fields: ["shop_id"] },
            { fields: ["status", "next_refresh_at"] },
            { fields: ["status", "expires_at"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
        if (db.Shop) Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        Model.belongsTo(db.TurboPackage, { foreignKey: "package_id", as: "package" });
        Model.belongsTo(db.WalletTransaction, { foreignKey: "wallet_transaction_id", as: "wallet_transaction" });
    };

    return Model;
};

module.exports.TURBO_BOOST_STATUSES = TURBO_BOOST_STATUSES;
