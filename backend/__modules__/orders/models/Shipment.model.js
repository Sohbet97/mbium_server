const { DataTypes } = require("sequelize");

const SHIPMENT_STATUSES = {
    PENDING: "PENDING",
    IN_TRANSIT: "IN_TRANSIT",
    DELIVERED: "DELIVERED",
    RETURNED: "RETURNED",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("shipments", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "orders", key: "id" },
            onDelete: "CASCADE",
        },
        carrier: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        tracking_number: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: SHIPMENT_STATUSES.PENDING,
        },
        shipped_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        delivered_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "warehouses", key: "id" },
            onDelete: "SET NULL",
        },
    }, {
        timestamps: true,
        indexes: [
            { fields: ["order_id"] },
            { fields: ["status"] },
            { fields: ["tracking_number"] },
            { fields: ["warehouse_id"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });
        if (db.Warehouse) {
            Model.belongsTo(db.Warehouse, { foreignKey: "warehouse_id", as: "warehouse" });
        }
    };

    return Model;
};
