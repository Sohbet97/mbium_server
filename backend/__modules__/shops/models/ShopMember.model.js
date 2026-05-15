const { DataTypes } = require("sequelize");

const SHOP_MEMBER_ROLES = {
    OWNER: "OWNER",
    DIRECTOR: "DIRECTOR",
    MANAGER: "MANAGER",
    MODERATOR: "MODERATOR",
    STAFF: "STAFF",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("shop_members", {
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
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
        },
        role: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: SHOP_MEMBER_ROLES.STAFF,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        invited_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { unique: true, fields: ["shop_id", "user_id"] },
            { fields: ["shop_id"] },
            { fields: ["user_id"] },
            { fields: ["role"] },
            { fields: ["is_active"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
        Model.belongsTo(db.User, { foreignKey: "invited_by", as: "inviter" });
    };

    return Model;
};
