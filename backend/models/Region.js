const { DataTypes } = require("sequelize");
const STATUSES = require("../utils/statuses");

module.exports = (sequelize, Sequelize) => {
    const Region = sequelize.define("regions", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        short_name: {
            type: DataTypes.STRING(10)
        },
        ssu_code: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        type: {
            type: DataTypes.SMALLINT,
            defaultValue: 0
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
        isPolyclinical: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
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
    return Region;
}