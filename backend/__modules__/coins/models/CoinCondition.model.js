const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("coin_conditions", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        source_event: {
            type: DataTypes.STRING(50),
            allowNull: false,
            // ORDER_CLOSED | REVIEW_WRITTEN | REFERRAL | TASK | MANUAL
        },
        coins_amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        multiplier_priority: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: false,
            defaultValue: 1.00,
        },
        max_per_user_per_day: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
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
