const { DataTypes } = require("sequelize");

const DISPUTE_STATUSES = {
    OPEN: "OPEN",
    UNDER_REVIEW: "UNDER_REVIEW",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("disputes", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "orders", key: "id" },
            onDelete: "RESTRICT",
        },
        opened_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: DISPUTE_STATUSES.OPEN,
        },
        resolution: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        resolved_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
        resolved_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["order_id"] },
            { fields: ["opened_by"] },
            { fields: ["status"] },
        ],
    });

    Model.associate = (db) => {
        if (db.Order) {
            Model.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });
        }
        if (db.User) {
            Model.belongsTo(db.User, { foreignKey: "opened_by", as: "opener" });
            Model.belongsTo(db.User, { foreignKey: "resolved_by", as: "resolver" });
        }
    };

    return Model;
};

module.exports.DISPUTE_STATUSES = DISPUTE_STATUSES;
