const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("order_status_history", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "orders", key: "id" },
            onDelete: "CASCADE"
        },
        status: {
            type: DataTypes.SMALLINT,
            allowNull: false
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        changed_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL"
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ["order_id"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });
        Model.belongsTo(db.User, { foreignKey: "changed_by", as: "changer" });
    };

    return Model;
};
