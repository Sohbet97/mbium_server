const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("product_tag_map", {
        product_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "products", key: "id" },
        },
        tag_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "product_tags", key: "id" },
        },
    }, {
        timestamps: false,
        paranoid: false,
    });

    return Model;
};
