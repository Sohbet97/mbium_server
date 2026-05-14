const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define("chat_messages", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        chatroom_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "chat_rooms",
                key: "id"
            },
            onDelete: "CASCADE"
        },
        text: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        file: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        is_voice: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
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
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ["chatroom_id"] },
            { fields: ["createdBy"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.ChatRoom, { foreignKey: "chatroom_id", as: "room" });
        Model.belongsTo(db.User, { foreignKey: "createdBy", as: "sender" });
        Model.hasMany(db.ChatMessageRead, { foreignKey: "message_id", as: "reads" });
    };

    return Model;
};
