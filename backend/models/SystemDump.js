const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define("system_dumps", {
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        filename:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        filesize:{
            type:DataTypes.BIGINT,
            allowNull:true
        }
    }, {
        timestamps: true,
        updatedAt:false
    })
    return Model;
}