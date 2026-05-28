const { DataTypes } = require("sequelize");
const STATUSES = require("../../../utils/statuses");

module.exports = (sequelize) => {
    const Model = sequelize.define("shops", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        owner_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE"
        },
        type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "shop_types", key: "id" }
        },
        name: {
            type: DataTypes.STRING(255),
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
        description_tm: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        description_ru: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        description_en: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        location: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        coordinates: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        logo: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        city_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "cities", key: "id" }
        },
        region_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "regions", key: "id" }
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        order: {
            type: DataTypes.SMALLINT,
            allowNull: true
        },
        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: STATUSES.STATUSE_ACTIVE
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        verification_status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },
        verification_note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        verified_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
        rating: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 0
        },
        plan_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "plans", key: "id" },
            onDelete: "SET NULL",
        },
        // KYC / two-tier seller fields
        video_url:     { type: DataTypes.TEXT, allowNull: true },
        passport_file: { type: DataTypes.TEXT, allowNull: true },
        patent_file:   { type: DataTypes.TEXT, allowNull: true },
        bank_iban:     { type: DataTypes.STRING(34), allowNull: true },
        card_number:   { type: DataTypes.STRING(20), allowNull: true },
        // 0 = pending, 1 = standard seller, 2 = verified_pro
        seller_tier:   { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" }
        }
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["owner_id"] },
            { fields: ["type_id"] },
            { fields: ["status"] },
            { fields: ["is_active"] },
            { fields: ["region_id"] },
            { fields: ["city_id"] },
            { fields: ["verification_status"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { as: "owner", foreignKey: "owner_id" });
        Model.belongsTo(db.User, { as: "creator", foreignKey: "createdBy" });
        Model.belongsTo(db.ShopType, { as: "type", foreignKey: "type_id" });
        Model.belongsTo(db.Region, { as: "region", foreignKey: "region_id" });
        Model.belongsTo(db.City, { as: "city", foreignKey: "city_id" });
        Model.belongsTo(db.User, { as: "verifier", foreignKey: "verified_by" });
        if (db.Plan) {
            Model.belongsTo(db.Plan, { foreignKey: "plan_id", as: "plan" });
        }
        if (db.ShopSubscription) {
            Model.hasMany(db.ShopSubscription, { foreignKey: "shop_id", as: "subscriptions" });
        }
        if (db.ShopCategory && db.Category) {
            Model.belongsToMany(db.Category, {
                through: db.ShopCategory,
                foreignKey: "shop_id",
                otherKey: "category_id",
                as: "categories",
            });
        }
        if (db.ShopVerificationLog) {
            Model.hasMany(db.ShopVerificationLog, { foreignKey: "shop_id", as: "verificationLogs" });
        }
        if (db.Warehouse) {
            Model.hasMany(db.Warehouse, { foreignKey: "shop_id", as: "warehouses" });
        }
    };

    return Model;
};
