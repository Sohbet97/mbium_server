const { DataTypes } = require("sequelize");

const DISCOUNT_TYPES = {
    PERCENTAGE: "PERCENTAGE",
    FIXED: "FIXED",
    FREE_SHIPPING: "FREE_SHIPPING",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("discounts", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "shops", key: "id" },
            onDelete: "CASCADE",
        },
        code: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
        },
        type: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: DISCOUNT_TYPES.PERCENTAGE,
        },
        value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        min_order_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        max_uses: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        used_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        starts_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        ends_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { unique: true, fields: ["code"] },
            { fields: ["shop_id"] },
            { fields: ["is_active"] },
            { fields: ["ends_at"] },
        ],
    });

    Model.associate = (db) => {
        if (db.Shop) {
            Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        }
    };

    return Model;
};
