const { DataTypes } = require("sequelize")
const STATUSES = require("../utils/statuses")

module.exports = (sequelize, Sequelize) => {
    const City = sequelize.define("cities", {
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        region: {
            type: DataTypes.INTEGER,
            onDelete: "CASCADE",
            references: {
                model: "regions",
                key: 'id'
            }
        },
        code: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        order:{
            type:DataTypes.SMALLINT,
            allowNull:true
        },
        status:{
            type:DataTypes.SMALLINT,
            defaultValue:STATUSES.STATUSE_ACTIVE
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
    return City
}