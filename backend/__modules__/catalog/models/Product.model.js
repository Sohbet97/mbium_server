const { DataTypes } = require("sequelize");
const STATUSES = require("../../../utils/statuses");

module.exports = (sequelize) => {
    const Model = sequelize.define("products", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "shops", key: "id" },
            onDelete: "CASCADE"
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "categories", key: "id" }
        },
        name: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        name_ru: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        name_eng: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: "TMT"
        },
        compare_at_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true
        },
        sku: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        barcode: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        weight: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "Weight in grams"
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: []
        },
        handle: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: "URL-friendly slug for storefront"
        },
        seo_title: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        seo_description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        rating: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 0
        },
        review_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: STATUSES.STATUSE_ACTIVE
        },
        cost_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            comment: "Cost per item (for profit margin tracking)"
        },
        is_physical: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: "Physical product (requires shipping)"
        },
        track_inventory: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: "Whether to track stock quantity"
        },
        sell_when_out_of_stock: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: "Continue selling even when stock reaches 0"
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" }
        }
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["shop_id"] },
            { fields: ["category_id"] },
            { fields: ["status"] },
            { fields: ["is_active"] },
            { fields: ["price"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        Model.belongsTo(db.Category, { foreignKey: "category_id", as: "category" });
        Model.hasMany(db.ProductVariant, { foreignKey: "product_id", as: "variants" });
        if (db.ProductMedia) Model.hasMany(db.ProductMedia, { foreignKey: "product_id", as: "productMedia" });
        Model.hasMany(db.Review, { foreignKey: "product_id", as: "reviews" });
        Model.belongsToMany(db.Collection, {
            through: db.CollectionProduct,
            foreignKey: "product_id",
            otherKey: "collection_id",
            as: "collections",
        });
    };

    return Model;
};
