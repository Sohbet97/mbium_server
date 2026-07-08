const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("order_items", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "orders", key: "id" },
            onDelete: "CASCADE"
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
            onDelete: "RESTRICT"
        },
        variant_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "product_variants", key: "id" },
            onDelete: "SET NULL"
        },
        variant_size_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "product_variant_sizes", key: "id" },
            onDelete: "SET NULL"
        },
        product_name: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        unit_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },
        total_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ["order_id"] },
            { fields: ["product_id"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
        Model.belongsTo(db.ProductVariant, { foreignKey: "variant_id", as: "variant" });
        if (db.ProductVariantSize) {
            Model.belongsTo(db.ProductVariantSize, { foreignKey: "variant_size_id", as: "variantSize" });
        }
    };

    return Model;
};
