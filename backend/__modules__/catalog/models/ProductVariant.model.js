const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("product_variants", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
            onDelete: "CASCADE"
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
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
        sell_when_out_of_stock: {
            // Per-variant override; the product-level flag still allows every
            // variant, so the effective value is product OR variant.
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        attributes: {
            // Free-form key/value pairs for anything without its own column
            // (storage, material…). Colour used to live here too — clients still
            // read that as a fallback via frontend/src/lib/colors.js — but new
            // colours belong in color_hex below.
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        color_hex: {
            // Chosen from the `colors` palette; FK targets colors.hex, not its id
            type: DataTypes.CHAR(7),
            allowNull: true,
            references: { model: "colors", key: "hex" }
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["product_id"] },
            { fields: ["is_active"] },
            { fields: ["color_hex"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
        if (db.Color) {
            Model.belongsTo(db.Color, { foreignKey: "color_hex", targetKey: "hex", as: "color" });
        }
        if (db.InventoryLevel) {
            Model.hasMany(db.InventoryLevel, { foreignKey: "variant_id", as: "inventoryLevels" });
        }
        if (db.ProductVariantSize) {
            Model.hasMany(db.ProductVariantSize, { foreignKey: "variant_id", as: "sizes" });
        }
        if (db.ProductPriceTier) {
            Model.hasMany(db.ProductPriceTier, { foreignKey: "variant_id", as: "priceTiers" });
        }
        if (db.ProductMedia) {
            Model.hasMany(db.ProductMedia, { foreignKey: "variant_id", as: "media" });
        }
    };

    return Model;
};
