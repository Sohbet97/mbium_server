const { DataTypes } = require("sequelize");
const USER_CONSTANTS = require("../utils/constants");

module.exports = (sequelize) => {
    const Model = sequelize.define(
        "user_otp_sessions",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },

            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: { model: "users", key: "id" },
                onDelete: "CASCADE",
            },

            // bcrypt hash of the 6-digit OTP — never stored plain
            otp_hash: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },

            purpose: {
                type: DataTypes.ENUM(...Object.values(USER_CONSTANTS.OTP_PURPOSES)),
                allowNull: false,
                defaultValue: USER_CONSTANTS.OTP_PURPOSES.LOGIN,
            },

            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            attempts: {
                type: DataTypes.SMALLINT,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            timestamps: true,
            updatedAt: false,
            paranoid: false,
            indexes: [
                { fields: ["user_id"] },
                { fields: ["expires_at"] }
            ],
        }
    );

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
    };

    return Model;
};