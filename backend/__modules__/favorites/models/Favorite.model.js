const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("favorites", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
        },
    }, {
        timestamps: true,
        paranoid: false,
        updatedAt: false,
        indexes: [
            { unique: true, fields: ["user_id", "product_id"] },
            { fields: ["user_id"] },
            { fields: ["product_id"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User,    { foreignKey: "user_id",    as: "user" });
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
    };

    return Model;
};
