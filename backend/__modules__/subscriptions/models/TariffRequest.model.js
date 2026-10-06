const { DataTypes } = require("sequelize");

const TARIFF_REQUEST_STATUSES = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("tariff_requests", {
        id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        shop_id:         { type: DataTypes.INTEGER, allowNull: false, references: { model: "shops", key: "id" }, onDelete: "CASCADE" },
        plan_id:         { type: DataTypes.INTEGER, allowNull: false, references: { model: "plans", key: "id" } },
        current_plan_id: { type: DataTypes.INTEGER, allowNull: true,  references: { model: "plans", key: "id" }, onDelete: "SET NULL" },
        status:          { type: DataTypes.STRING(20), allowNull: false, defaultValue: TARIFF_REQUEST_STATUSES.PENDING },
        comment:         { type: DataTypes.TEXT, allowNull: true },
        admin_comment:   { type: DataTypes.TEXT, allowNull: true },
        requested_by:    { type: DataTypes.UUID, allowNull: true, references: { model: "users", key: "id" }, onDelete: "SET NULL" },
        reviewed_by:     { type: DataTypes.UUID, allowNull: true, references: { model: "users", key: "id" }, onDelete: "SET NULL" },
        reviewed_at:     { type: DataTypes.DATE, allowNull: true },
    }, {
        timestamps: true,
        indexes: [
            { fields: ["shop_id"] },
            { fields: ["status"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: "shop_id",         as: "shop" });
        Model.belongsTo(db.Plan, { foreignKey: "plan_id",         as: "plan" });
        Model.belongsTo(db.Plan, { foreignKey: "current_plan_id", as: "currentPlan" });
        Model.belongsTo(db.User, { foreignKey: "requested_by",    as: "requester" });
        Model.belongsTo(db.User, { foreignKey: "reviewed_by",     as: "reviewer" });
    };

    return Model;
};

module.exports.TARIFF_REQUEST_STATUSES = TARIFF_REQUEST_STATUSES;
