const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("delivery_addresses", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
        },
        label: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        region_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "regions", key: "id" },
            onDelete: "SET NULL",
        },
        city_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "cities", key: "id" },
            onDelete: "SET NULL",
        },
        district_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "districts", key: "id" },
            onDelete: "SET NULL",
        },
        street: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        apartment: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        postal_code: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["user_id"] },
            { fields: ["region_id"] },
            { fields: ["city_id"] },
            { fields: ["is_default"] },
        ],
    });

    Model.associate = (db) => {
        if (db.User) {
            Model.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
        }
        if (db.Region) {
            Model.belongsTo(db.Region, { foreignKey: "region_id", as: "region" });
        }
        if (db.City) {
            Model.belongsTo(db.City, { foreignKey: "city_id", as: "city" });
        }
        if (db.District) {
            Model.belongsTo(db.District, { foreignKey: "district_id", as: "district" });
        }
    };

    return Model;
};
