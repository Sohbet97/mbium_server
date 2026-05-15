const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("review_replies", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        review_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: "reviews", key: "id" },
            onDelete: "CASCADE",
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "shops", key: "id" },
            onDelete: "CASCADE",
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { unique: true, fields: ["review_id"] },
            { fields: ["shop_id"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Review, { foreignKey: "review_id", as: "review" });
        if (db.Shop) {
            Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        }
        if (db.User) {
            Model.belongsTo(db.User, { foreignKey: "createdBy", as: "author" });
        }
    };

    return Model;
};
