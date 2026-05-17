const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("collections", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        name_ru: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        name_eng: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        image_url: {
            type: DataTypes.STRING(1000),
            allowNull: true,
        },
        handle: {
            type: DataTypes.STRING(255),
            allowNull: true,
            // unique: true,
            comment: "URL-friendly slug for storefront",
        },
        seo_title: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        seo_description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        sort_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["is_active"] },
            { fields: ["sort_order"] },
        ],
    });

    Model.associate = (db) => {
        Model.hasMany(db.CollectionProduct, { foreignKey: "collection_id", as: "collectionProducts" });
        Model.belongsToMany(db.Product, {
            through: db.CollectionProduct,
            foreignKey: "collection_id",
            otherKey: "product_id",
            as: "products",
        });
    };

    return Model;
};
