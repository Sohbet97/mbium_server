const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("user_coin_balances", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: { model: "users", key: "id" },
        },
        balance: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_earned: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_spent: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [{ fields: ["user_id"], unique: true }],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
    };

    return Model;
};
