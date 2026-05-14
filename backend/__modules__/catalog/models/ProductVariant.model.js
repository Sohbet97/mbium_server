const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("product_variants", {
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
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        sku: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        attributes: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["product_id"] },
            { fields: ["is_active"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
    };

    return Model;
};
