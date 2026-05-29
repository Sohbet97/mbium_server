const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("product_tags", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING(120),
            allowNull: false,
            unique: true,
        },
    }, {
        timestamps: true,
        paranoid: false,
        updatedAt: false,
        createdAt: "created_at",
    });

    Model.associate = (db) => {
        Model.belongsToMany(db.Product, {
            through: "product_tag_map",
            foreignKey: "tag_id",
            otherKey: "product_id",
            as: "products",
        });
    };

    return Model;
};
