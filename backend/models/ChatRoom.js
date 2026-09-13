const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define("chat_rooms", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        theme: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: 0
        },
        type: {
            type: DataTypes.SMALLINT,
            defaultValue: 0
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            }
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "shops",
                key: "id"
            }
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "products",
                key: "id"
            }
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ["createdBy"] },
        ]
    });

    Model.associate = (db) => {
        Model.hasMany(db.ChatRoomParticipant, { foreignKey: "chatroom_id", as: "participants" });
        Model.hasMany(db.ChatMessage, { foreignKey: "chatroom_id", as: "messages" });
        Model.belongsTo(db.User, { foreignKey: "createdBy", as: "creator" });
        Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        Model.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
    };

    return Model;
};
