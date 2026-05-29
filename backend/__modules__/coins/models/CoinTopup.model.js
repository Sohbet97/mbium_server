const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("coin_topups", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
        },
        amount_tmt: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        coins_requested: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "PENDING",
            // PENDING | APPROVED | REJECTED
        },
        receipt_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        reviewed_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
        },
        reviewed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { fields: ["user_id"] },
            { fields: ["status"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "requester" });
        Model.belongsTo(db.User, { foreignKey: "reviewed_by", as: "reviewer" });
    };

    return Model;
};
