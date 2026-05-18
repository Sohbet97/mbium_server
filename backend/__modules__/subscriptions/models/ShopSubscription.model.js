const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("shop_subscriptions", {
        id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        shop_id:     { type: DataTypes.INTEGER, allowNull: false, references: { model: "shops", key: "id" }, onDelete: "CASCADE" },
        plan_id:     { type: DataTypes.INTEGER, allowNull: false, references: { model: "plans", key: "id" } },
        status:      { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 1 },
        starts_at:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        ends_at:     { type: DataTypes.DATE, allowNull: true },
        note:        { type: DataTypes.TEXT, allowNull: true },
        assigned_by: { type: DataTypes.UUID, allowNull: true, references: { model: "users", key: "id" }, onDelete: "SET NULL" },
    }, {
        timestamps: true,
        indexes: [
            { fields: ["shop_id"] },
            { fields: ["status"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        Model.belongsTo(db.Plan, { foreignKey: "plan_id", as: "plan" });
        if (db.User) {
            Model.belongsTo(db.User, { foreignKey: "assigned_by", as: "assignedBy" });
        }
    };

    return Model;
};
