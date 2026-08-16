const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("delivery_types", {
        id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name:       { type: DataTypes.STRING(200), allowNull: false },
        name_ru:    { type: DataTypes.STRING(200), allowNull: true },
        name_en:    { type: DataTypes.STRING(200), allowNull: true },
        code:       { type: DataTypes.STRING(50), allowNull: false, unique: true },
        is_active:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { fields: ["code"], unique: true },
            { fields: ["is_active"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsToMany(db.Product, {
            through: db.ProductDeliveryType,
            foreignKey: "delivery_type_id",
            otherKey: "product_id",
            as: "products",
        });
        if (db.ShopDeliveryType && db.Shop) {
            Model.belongsToMany(db.Shop, {
                through: db.ShopDeliveryType,
                foreignKey: "delivery_type_id",
                otherKey: "shop_id",
                as: "shops",
            });
        }
    };

    return Model;
};
