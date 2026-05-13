const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Model = sequelize.define("user_sessions", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE"
        },
        assignment_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "user_position_assignments", key: "id" },
            onDelete: "CASCADE"
        },
        refresh_token: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },
        device_info: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        ip: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        last_used: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        timestamps: true
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", targetKey: "id", as: "_user" });
        Model.belongsTo(db.UserPositionAssignment, { foreignKey: "assignment_id", targetKey: "id", as: "assignment" });
    };

    return Model;
};