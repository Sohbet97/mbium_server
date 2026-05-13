const { DataTypes } = require("sequelize");
const STATUSES = require("../utils/statuses");

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define("districts", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        region: {
            type: DataTypes.INTEGER,
            onDelete: "CASCADE",
            allowNull: true,
            references: {
                model: "regions",
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        type: {
            type: DataTypes.SMALLINT,
            defaultValue: 0
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
            onDelete: "SET NULL",
            references: {
                model: "users",
                key: 'id'
            }
        }
    }, {
        timestamps: true
    })
    return Model
}