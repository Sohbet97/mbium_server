const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("product_delivery_types", {
        product_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "products", key: "id" },
        },
        delivery_type_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "delivery_types", key: "id" },
        },
    }, {
        timestamps: false,
        paranoid: false,
    });

    return Model;
};
