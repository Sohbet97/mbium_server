const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("cart_items", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE"
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
            onDelete: "CASCADE"
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
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ["user_id"] },
            { unique: true, fields: ["user_id", "product_id", "variant_id", "variant_size_id"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
        Model.belongsTo(db.ProductVariant, { foreignKey: "variant_id", as: "variant" });
        if (db.ProductVariantSize) {
            Model.belongsTo(db.ProductVariantSize, { foreignKey: "variant_size_id", as: "variantSize" });
        }
    };

    return Model;
};
