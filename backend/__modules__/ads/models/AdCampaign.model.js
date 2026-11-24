const { DataTypes } = require("sequelize");

const AD_CAMPAIGN_STATUSES = { PENDING: "pending", ACTIVE: "active", REJECTED: "rejected", FINISHED: "finished" };

module.exports = (sequelize) => {
    const Model = sequelize.define("ad_campaigns", {
        id:                    { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        shop_id:               { type: DataTypes.INTEGER, allowNull: false, references: { model: "shops", key: "id" } },
        budget:                { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        user_percent:          { type: DataTypes.SMALLINT, allowNull: false },
        user_pool:             { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        platform_fee:          { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        spent:                 { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        reserved:              { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        status:                { type: DataTypes.STRING(10), allowNull: false, defaultValue: AD_CAMPAIGN_STATUSES.PENDING },
        comment:               { type: DataTypes.TEXT, allowNull: true },
        wallet_transaction_id: { type: DataTypes.INTEGER, allowNull: true },
        approved_at:           { type: DataTypes.DATE, allowNull: true },
        finished_at:           { type: DataTypes.DATE, allowNull: true },
    }, { timestamps: true });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        Model.hasMany(db.AdCampaignTask, { foreignKey: "campaign_id", as: "tasks" });
    };

    return Model;
};

module.exports.AD_CAMPAIGN_STATUSES = AD_CAMPAIGN_STATUSES;
