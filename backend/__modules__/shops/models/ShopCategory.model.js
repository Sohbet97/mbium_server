const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("shop_categories", {
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
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "categories", key: "id" },
            onDelete: "CASCADE",
        },
    }, {
        timestamps: false,
        indexes: [
            { unique: true, fields: ["shop_id", "category_id"] },
            { fields: ["shop_id"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: "shop_id" });
        Model.belongsTo(db.Category, { foreignKey: "category_id" });
    };

    return Model;
};
