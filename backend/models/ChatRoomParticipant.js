const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define("chat_room_participants", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        chatroom_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "chat_rooms", key: "id" },
            onDelete: "CASCADE"
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE"
        },
        role: {
            type: DataTypes.SMALLINT,
            defaultValue: 0
        },
        joined_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        left_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        timestamps: false,
        indexes: [
            { unique: true, fields: ["chatroom_id", "user_id"] },
            { fields: ["user_id"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.ChatRoom, { foreignKey: "chatroom_id", as: "room" });
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
    };

    return Model;
};
