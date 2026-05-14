const { DataTypes } = require("sequelize");
const STATUSES = require("../utils/statuses");

module.exports = (sequelize, Sequelize) => {
    const Village = sequelize.define("villages", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        district_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            onDelete: "CASCADE",
            references: {
                model: "districts",
                key: "id"
            }
        },
        code: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
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
        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            onDelete: "SET NULL",
            references: {
                model: "users",
                key: "id"
            }
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ["district_id"] },
            { unique: true, fields: ["district_id", "name"] },
        ]
    });
    return Village;
};
