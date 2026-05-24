const { DataTypes } = require("sequelize");

const DISCOUNT_TYPES = {
    PERCENTAGE: "PERCENTAGE",
    FIXED: "FIXED",
    FREE_SHIPPING: "FREE_SHIPPING",
};

const DISCOUNT_CATEGORIES = {
    ORDER: "ORDER",
    PRODUCT: "PRODUCT",
    FREE_SHIPPING: "FREE_SHIPPING",
    BUY_X_GET_Y: "BUY_X_GET_Y",
};

const DISCOUNT_METHODS = {
    CODE: "CODE",
    AUTOMATIC: "AUTOMATIC",
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
        category: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: DISCOUNT_CATEGORIES.ORDER,
        },
        method: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: DISCOUNT_METHODS.CODE,
        },
        code: {
            type: DataTypes.STRING(64),
            allowNull: true,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: true,
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
        applies_to_type: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'ALL', // ALL | CATEGORIES | PRODUCTS
        },
        applies_to_ids: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        min_order_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        min_quantity: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        buy_quantity: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        get_quantity: {
            type: DataTypes.INTEGER,
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
