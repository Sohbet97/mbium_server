const { DataTypes } = require("sequelize");
const STATUSES = require("../utils/statuses");

module.exports = (sequelize, Sequelize) => {
    const City = sequelize.define("cities", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        region_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            onDelete: "CASCADE",
            references: {
                model: "regions",
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
        order: {
            type: DataTypes.SMALLINT,
            allowNull: true
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: STATUSES.STATUSE_ACTIVE
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
            { fields: ["region_id"] },
            { unique: true, fields: ["region_id", "name"] },
        ]
    });
    return City;
};
