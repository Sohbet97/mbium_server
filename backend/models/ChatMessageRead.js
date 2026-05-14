const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define("chat_message_reads", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        message_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "chat_messages", key: "id" },
            onDelete: "CASCADE"
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE"
        },
        read_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        timestamps: false,
        indexes: [
            { unique: true, fields: ["message_id", "user_id"] },
            { fields: ["user_id"] },
        ]
    });

    Model.associate = (db) => {
        Model.belongsTo(db.ChatMessage, { foreignKey: "message_id", as: "message" });
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
    };

    return Model;
};
