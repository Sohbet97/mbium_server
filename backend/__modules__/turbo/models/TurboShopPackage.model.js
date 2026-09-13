const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("turbo_shop_packages", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        tier_hours: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            unique: true,
        },
        price_tmt: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        price_coin: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        duration_days: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 7,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        timestamps: true,
        paranoid: false,
    });

    return Model;
};
