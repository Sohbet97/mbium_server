const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define("notifications", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        type: {
            type: DataTypes.SMALLINT
        },
        target_id: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            onDelete: "CASCADE",
            references: {
                model: "users",
                key: "id"
            }
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: 0
        },
        content: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        read_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ["user_id"] },
            { fields: ["status"] },
        ]
    });
    return Notification;
};
