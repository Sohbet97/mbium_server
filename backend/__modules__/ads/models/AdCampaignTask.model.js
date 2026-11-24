const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("ad_campaign_tasks", {
        id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        campaign_id:   { type: DataTypes.INTEGER, allowNull: false, references: { model: "ad_campaigns", key: "id" } },
        task_type_id:  { type: DataTypes.INTEGER, allowNull: false, references: { model: "ad_task_types", key: "id" } },
        price:         { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        ball:          { type: DataTypes.INTEGER, allowNull: false },
        scope:         { type: DataTypes.STRING(10), allowNull: true }, // all | selected; NULL for shop targets
        target_ids:    { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: true },
        limit:         { type: DataTypes.INTEGER, allowNull: true },    // NULL = no limit
        done_count:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        pending_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, { timestamps: false });

    Model.associate = (db) => {
        Model.belongsTo(db.AdCampaign, { foreignKey: "campaign_id", as: "campaign" });
        Model.belongsTo(db.AdTaskType, { foreignKey: "task_type_id", as: "type" });
    };

    return Model;
};
