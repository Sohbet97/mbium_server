const { DataTypes } = require("sequelize");

const BANNER_PLACEMENTS = {
    HOME: "HOME",
    SHOP: "SHOP",
    CATEGORY: "CATEGORY",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("banners", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "shops", key: "id" },
            onDelete: "CASCADE",
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        image_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        link_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        placement: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: BANNER_PLACEMENTS.HOME,
        },
        order: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },
        starts_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        ends_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["shop_id"] },
            { fields: ["placement"] },
            { fields: ["is_active"] },
            { fields: ["order"] },
            { fields: ["ends_at"] },
        ],
    });

    Model.associate = (db) => {
        if (db.Shop) {
            Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        }
    };

    return Model;
};
