const { DataTypes } = require("sequelize");
const STATUSES = require("../utils/statuses");

module.exports = (sequelize, Sequelize) => {
    const Village = sequelize.define("villages", {
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        district: {
            type: DataTypes.INTEGER,
            onDelete: "CASCADE",
            references: {
                model: "districts",
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
        ssu_code: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        type: {
            type: DataTypes.SMALLINT,
            defaultValue: 0
        },
        order:{
            type:DataTypes.SMALLINT,
            allowNull:true
        },
        status:{
            type:DataTypes.SMALLINT,
            defaultValue:STATUSES.STATUSE_ACTIVE
        },
        uuid:{
            type:DataTypes.UUID,
            allowNull:true
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
    return Village;
}