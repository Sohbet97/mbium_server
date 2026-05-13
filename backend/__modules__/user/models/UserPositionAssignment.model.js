const { DataTypes } = require('sequelize');
const { POSITION_ASSIGNMENT_TYPES_ENUM } = require('../utils/position_assignments');
const { POSITION_ASSIGNMENT_TYPES } = require('../utils/constants');

module.exports = (sequelize) => {
    const Model = sequelize.define("user_position_assignments", {
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
        position_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "positions", key: "id" },
            onDelete: "CASCADE"
        },
        assignment_type: {
            type: DataTypes.ENUM(...POSITION_ASSIGNMENT_TYPES_ENUM),
            defaultValue: POSITION_ASSIGNMENT_TYPES.PRIMARY
        },
        replaced_assignment_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        started_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        ended_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
    }, {
        timestamps: true,
        paranoid: true,
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", targetKey: "id", as: "user" });
        Model.belongsTo(db.UserPosition, { foreignKey: "position_id", targetKey: "id", as: "position" });
        Model.belongsTo(Model, { foreignKey: "replaced_assignment_id", targetKey: "id", as: "replaced_assignment", constraints: false });
    };

    return Model;
};