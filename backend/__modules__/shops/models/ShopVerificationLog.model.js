const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("shop_verification_logs", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "shops", key: "id" },
            onDelete: "CASCADE",
        },
        action: {
            type: DataTypes.STRING(20),
            allowNull: false, // 'submitted' | 'approved' | 'rejected'
        },
        note: { type: DataTypes.TEXT, allowNull: true },
        admin_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        timestamps: false,
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        Model.belongsTo(db.User, { foreignKey: "admin_id", as: "admin" });
    };

    return Model;
};
