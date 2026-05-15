const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("seller_balances", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: "shops", key: "id" },
            onDelete: "RESTRICT",
        },
        balance: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: "TMT",
        },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { unique: true, fields: ["shop_id"] },
        ],
    });

    Model.associate = (db) => {
        if (db.Shop) {
            Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        }
    };

    return Model;
};
