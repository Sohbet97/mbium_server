const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("product_price_tiers", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "products", key: "id" },
            onDelete: "CASCADE"
        },
        variant_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "product_variants", key: "id" },
            onDelete: "CASCADE"
        },
        min_qty: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        max_qty: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        unit_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["product_id"] },
            { fields: ["variant_id"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
        Model.belongsTo(db.ProductVariant, { foreignKey: "variant_id", as: "variant" });
    };

    return Model;
};
