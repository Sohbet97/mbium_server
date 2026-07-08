const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("inventory_levels", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "warehouses", key: "id" },
            onDelete: "CASCADE",
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
            onDelete: "CASCADE",
        },
        variant_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "product_variants", key: "id" },
            onDelete: "CASCADE",
        },
        variant_size_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "product_variant_sizes", key: "id" },
            onDelete: "CASCADE",
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        reserved: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        timestamps: true,
        indexes: [
            { fields: ["warehouse_id"] },
            { fields: ["product_id"] },
            { fields: ["variant_id"] },
            { fields: ["variant_size_id"] },
            { fields: ["warehouse_id", "product_id", "variant_id", "variant_size_id"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Warehouse, { foreignKey: "warehouse_id", as: "warehouse" });
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
        if (db.ProductVariant) {
            Model.belongsTo(db.ProductVariant, { foreignKey: "variant_id", as: "variant" });
        }
        if (db.ProductVariantSize) {
            Model.belongsTo(db.ProductVariantSize, { foreignKey: "variant_size_id", as: "variantSize" });
        }
    };

    return Model;
};
