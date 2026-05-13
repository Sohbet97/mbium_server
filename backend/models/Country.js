const { DataTypes } = require("sequelize");
const STATUSES = require("../utils/statuses");

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define("countries", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        thumbnail: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        code: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        ssu_code: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        order: {
            type: DataTypes.SMALLINT,
            allowNull: true
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: STATUSES.STATUSE_ACTIVE
        },
        uuid: {
            type: DataTypes.UUID,
            allowNull: true
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            onDelete: 'SET NULL',
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        timestamps: true
    });
    return Model;
}