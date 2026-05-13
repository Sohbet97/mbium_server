const { DataTypes } = require("sequelize")

module.exports = (sequelize, Sequelize) => {
    const Config = sequelize.define("configurations", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        is_otp_enabled:{
            type:DataTypes.BOOLEAN,
            defaultValue:false
        }

    }, {
        timestamps: true
    });

    return Config;
}