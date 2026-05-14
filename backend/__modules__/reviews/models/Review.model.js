const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("reviews", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE"
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
            onDelete: "CASCADE"
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "orders", key: "id" },
            onDelete: "SET NULL"
        },
        rating: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            validate: { min: 1, max: 5 }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["product_id"] },
            { fields: ["user_id"] },
            { fields: ["rating"] },
            { unique: true, fields: ["user_id", "product_id", "order_id"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "author" });
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
        Model.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });
    };

    return Model;
};
