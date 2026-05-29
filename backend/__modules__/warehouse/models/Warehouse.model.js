const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("warehouses", {
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
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        contact_phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        timestamps: true,
        indexes: [
            { fields: ["shop_id"] },
            { fields: ["is_active"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        Model.hasMany(db.InventoryLevel, { foreignKey: "warehouse_id", as: "inventory" });
        Model.hasMany(db.StockMovement, { foreignKey: "warehouse_id", as: "movements" });
        if (db.Shipment) {
            Model.hasMany(db.Shipment, { foreignKey: "warehouse_id", as: "shipments" });
        }
    };

    return Model;
};
