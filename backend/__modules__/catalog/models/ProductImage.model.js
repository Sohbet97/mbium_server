const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("product_images", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
            onDelete: "CASCADE"
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        is_primary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        order: {
            type: DataTypes.SMALLINT,
            allowNull: true
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ["product_id"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
    };

    return Model;
};
