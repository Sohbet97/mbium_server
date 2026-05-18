const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("plans", {
        id:                   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name:                 { type: DataTypes.STRING(50), allowNull: false, unique: true },
        display_name_tm:      { type: DataTypes.STRING(100), allowNull: true },
        display_name_ru:      { type: DataTypes.STRING(100), allowNull: true },
        display_name_en:      { type: DataTypes.STRING(100), allowNull: true },
        price_monthly:        { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        commission_rate:      { type: DataTypes.DECIMAL(5, 4), allowNull: false, defaultValue: 0.15 },
        product_limit:        { type: DataTypes.INTEGER, allowNull: true },
        hotspot_per_month:    { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
        hotspot_duration_hrs: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
        ai_credits_monthly:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
        auction_per_week:     { type: DataTypes.SMALLINT, allowNull: true },
        live_stream_mode:     { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
        ads_dashboard:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        coin_earn:            { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        coin_earn_priority:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        verified_badge:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        virtual_tour:         { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        oem_odm_support:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        revenue_share_user:   { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
        push_notif_monthly:   { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
        is_active:            { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order:           { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    }, {
        timestamps: true,
        indexes: [{ fields: ["name"] }, { fields: ["sort_order"] }],
    });

    Model.associate = (db) => {
        Model.hasMany(db.Shop, { foreignKey: "plan_id", as: "shops" });
        Model.hasMany(db.ShopSubscription, { foreignKey: "plan_id", as: "subscriptions" });
    };

    return Model;
};
