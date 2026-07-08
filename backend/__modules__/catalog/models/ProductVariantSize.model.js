const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("product_variant_sizes", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        variant_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "product_variants", key: "id" },
            onDelete: "CASCADE"
        },
        size_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "sizes", key: "id" },
            onDelete: "RESTRICT"
        },
        sku: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        barcode: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true
        },
        compare_at_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { unique: true, fields: ["variant_id", "size_id"] },
            { fields: ["variant_id"] },
            { fields: ["size_id"] },
            { fields: ["is_active"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.ProductVariant, { foreignKey: "variant_id", as: "variant" });
        Model.belongsTo(db.Size, { foreignKey: "size_id", as: "size" });
        if (db.InventoryLevel) {
            Model.hasMany(db.InventoryLevel, { foreignKey: "variant_size_id", as: "inventoryLevels" });
        }
    };

    return Model;
};
