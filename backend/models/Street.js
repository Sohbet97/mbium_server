const { DataTypes } = require("sequelize");
const STATUSES = require("../utils/statuses");

module.exports = (sequelize, Sequelize) => {
    const Street = sequelize.define("streets", {
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
        village: {
            type: DataTypes.INTEGER,
            onDelete: "CASCADE",
            references: {
                model: "villages",
                key: 'id'
            }
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
    return Street;
}