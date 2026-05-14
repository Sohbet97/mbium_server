const { DataTypes } = require("sequelize");
const STATUSES = require("../../../utils/statuses");

module.exports = (sequelize) => {
    const Model = sequelize.define("categories", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "categories", key: "id" },
            onDelete: "SET NULL"
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        name_ru: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        name_eng: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        icon: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        order: {
            type: DataTypes.SMALLINT,
            allowNull: true
        },
        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: STATUSES.STATUSE_ACTIVE
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" }
        }
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["parent_id"] },
            { fields: ["status"] },
            { fields: ["slug"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(Model, { foreignKey: "parent_id", as: "parent" });
        Model.hasMany(Model, { foreignKey: "parent_id", as: "children" });
        Model.hasMany(db.Product, { foreignKey: "category_id", as: "products" });
    };

    return Model;
};
