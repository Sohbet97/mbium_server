const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("collection_products", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        collection_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "collections", key: "id" },
            onDelete: "CASCADE",
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
            onDelete: "CASCADE",
        },
        sort_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    }, {
        timestamps: true,
        indexes: [
            { fields: ["collection_id"] },
            { fields: ["product_id"] },
            { unique: true, fields: ["collection_id", "product_id"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Collection, { foreignKey: "collection_id", as: "collection" });
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
    };

    return Model;
};
