const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("shop_brands", {
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
        brand_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "brands", key: "id" },
            onDelete: "CASCADE",
        },
    }, {
        timestamps: false,
        indexes: [
            { unique: true, fields: ["shop_id", "brand_id"] },
            { fields: ["shop_id"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: "shop_id" });
        Model.belongsTo(db.Brand, { foreignKey: "brand_id" });
    };

    return Model;
};
