const { DataTypes } = require("sequelize");

const MOVEMENT_TYPES = {
    INBOUND:    "INBOUND",
    OUTBOUND:   "OUTBOUND",
    ADJUSTMENT: "ADJUSTMENT",
    RETURN:     "RETURN",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("stock_movements", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "warehouses", key: "id" },
            onDelete: "RESTRICT",
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
        variant_size_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "product_variant_sizes", key: "id" },
            onDelete: "SET NULL",
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "orders", key: "id" },
            onDelete: "SET NULL",
        },
        type: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity_before: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity_after: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
    }, {
        timestamps: true,
        indexes: [
            { fields: ["warehouse_id"] },
            { fields: ["product_id"] },
            { fields: ["order_id"] },
            { fields: ["type"] },
            { fields: ["createdAt"] },
        ],
    });

    Model.TYPES = MOVEMENT_TYPES;

    Model.associate = (db) => {
        Model.belongsTo(db.Warehouse, { foreignKey: "warehouse_id", as: "warehouse" });
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
        if (db.ProductVariant) {
            Model.belongsTo(db.ProductVariant, { foreignKey: "variant_id", as: "variant" });
        }
        if (db.ProductVariantSize) {
            Model.belongsTo(db.ProductVariantSize, { foreignKey: "variant_size_id", as: "variantSize" });
        }
        if (db.Order) {
            Model.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });
        }
        if (db.User) {
            Model.belongsTo(db.User, { foreignKey: "created_by", as: "creator" });
        }
    };

    return Model;
};
