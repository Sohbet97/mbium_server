const { DataTypes } = require("sequelize")

module.exports = (sequelize, Sequelize) => {
    const Config = sequelize.define("configurations", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        is_otp_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        platform_commission_rate: {
            type: DataTypes.DECIMAL(5, 4),
            allowNull: false,
            defaultValue: 0.05,
        },
        min_payout_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 100,
        },

    }, {
        timestamps: true
    });

    return Config;
}