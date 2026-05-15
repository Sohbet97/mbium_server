const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("flash_sales", {
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
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
            onDelete: "RESTRICT",
        },
        variant_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "product_variants", key: "id" },
            onDelete: "SET NULL",
        },
        sale_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        original_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        quantity_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sold_count: {
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
            { fields: ["shop_id"] },
            { fields: ["product_id"] },
            { fields: ["variant_id"] },
            { fields: ["is_active"] },
            { fields: ["starts_at"] },
            { fields: ["ends_at"] },
        ],
    });

    Model.associate = (db) => {
        if (db.Shop) {
            Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        }
        if (db.Product) {
            Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
        }
        if (db.ProductVariant) {
            Model.belongsTo(db.ProductVariant, { foreignKey: "variant_id", as: "variant" });
        }
    };

    return Model;
};
