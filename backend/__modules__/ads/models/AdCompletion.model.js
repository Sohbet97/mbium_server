const { DataTypes } = require("sequelize");

const AD_COMPLETION_STATUSES = { PENDING: "pending", APPROVED: "approved", REJECTED: "rejected" };

module.exports = (sequelize) => {
    const Model = sequelize.define("ad_completions", {
        id:                  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        campaign_task_id:    { type: DataTypes.INTEGER, allowNull: false, references: { model: "ad_campaign_tasks", key: "id" } },
        campaign_id:         { type: DataTypes.INTEGER, allowNull: false, references: { model: "ad_campaigns", key: "id" } },
        user_id:             { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" } },
        target_id:           { type: DataTypes.INTEGER, allowNull: false },
        review_id:           { type: DataTypes.INTEGER, allowNull: true },
        status:              { type: DataTypes.STRING(10), allowNull: false },
        price:               { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        ball:                { type: DataTypes.INTEGER, allowNull: false },
        coin_transaction_id: { type: DataTypes.INTEGER, allowNull: true },
        comment:             { type: DataTypes.TEXT, allowNull: true },
        moderated_at:        { type: DataTypes.DATE, allowNull: true },
    }, { timestamps: true, updatedAt: false });

    Model.associate = (db) => {
        Model.belongsTo(db.AdCampaignTask, { foreignKey: "campaign_task_id", as: "task" });
        Model.belongsTo(db.AdCampaign, { foreignKey: "campaign_id", as: "campaign" });
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
        Model.belongsTo(db.Review, { foreignKey: "review_id", as: "review", constraints: false });
    };

    return Model;
};

module.exports.AD_COMPLETION_STATUSES = AD_COMPLETION_STATUSES;
