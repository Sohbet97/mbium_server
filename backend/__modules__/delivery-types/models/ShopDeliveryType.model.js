const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("shop_delivery_types", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "shops", key: "id" },
            onDelete: "CASCADE",
        },
        delivery_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "delivery_types", key: "id" },
            onDelete: "CASCADE",
        },
    }, {
        timestamps: false,
        indexes: [
            { unique: true, fields: ["shop_id", "delivery_type_id"] },
            { fields: ["shop_id"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: "shop_id" });
        Model.belongsTo(db.DeliveryType, { foreignKey: "delivery_type_id" });
    };

    return Model;
};
