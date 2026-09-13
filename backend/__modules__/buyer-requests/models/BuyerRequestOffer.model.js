const { DataTypes } = require("sequelize");

const BUYER_REQUEST_OFFER_STATUSES = {
    PENDING: "PENDING",
    COUNTERED: "COUNTERED",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    EXPIRED: "EXPIRED",
};

const OFFER_FROM_ROLE = {
    SELLER: "SELLER",
    BUYER: "BUYER",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("buyer_request_offers", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        buyer_request_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "buyer_requests", key: "id" },
            onDelete: "CASCADE",
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "shops", key: "id" },
            onDelete: "CASCADE",
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "products", key: "id" },
            onDelete: "SET NULL",
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
        parent_offer_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "buyer_request_offers", key: "id" },
            onDelete: "SET NULL",
        },
        from_role: {
            type: DataTypes.STRING(10),
            allowNull: false, // 'SELLER' | 'BUYER'
        },
        unit_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: "TMT",
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: BUYER_REQUEST_OFFER_STATUSES.PENDING,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        consumed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        consumed_order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "orders", key: "id" },
            onDelete: "SET NULL",
        },
    }, {
        timestamps: true,
        indexes: [
            { fields: ["buyer_request_id"] },
            { fields: ["shop_id"] },
            { fields: ["status"] },
            { fields: ["parent_offer_id"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.BuyerRequest, { foreignKey: "buyer_request_id", as: "request" });
        if (db.Shop) Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        if (db.Product) Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
        if (db.ProductVariant) Model.belongsTo(db.ProductVariant, { foreignKey: "variant_id", as: "variant" });
        if (db.ProductVariantSize) Model.belongsTo(db.ProductVariantSize, { foreignKey: "variant_size_id", as: "variantSize" });
        Model.belongsTo(Model, { foreignKey: "parent_offer_id", as: "parentOffer" });
        if (db.Order) Model.belongsTo(db.Order, { foreignKey: "consumed_order_id", as: "consumedOrder" });
        if (db.BuyerRequestOfferAttachment) Model.hasMany(db.BuyerRequestOfferAttachment, { foreignKey: "buyer_request_offer_id", as: "attachments" });
    };

    return Model;
};

module.exports.BUYER_REQUEST_OFFER_STATUSES = BUYER_REQUEST_OFFER_STATUSES;
module.exports.OFFER_FROM_ROLE = OFFER_FROM_ROLE;
