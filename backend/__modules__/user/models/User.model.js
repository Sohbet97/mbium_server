const { DataTypes } = require("sequelize");
const USER_CONSTANTS = require("../utils/constants");

module.exports = (sequelize) => {
    const Model = sequelize.define(
        "users",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },

            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                defaultValue: "User",
            },

            surname: {
                type: DataTypes.STRING(100),
            },

            birth_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },

            // Primary login credential — unique, validated TM format
            phone_number: {
                type: DataTypes.STRING(8),
                allowNull: true,
                unique: true,
                validate: {
                    is: {
                        args: USER_CONSTANTS.TM_PHONE_REGEX,
                        msg: "Phone number must be a valid Turkmen number (6[1-5] or 71 followed by 6 digits)",
                    },
                },
            },

            email: {
                type: DataTypes.STRING(100),
                allowNull: true,
                unique: true,
                validate: {
                    isEmail: { msg: "Invalid email address" },
                },
            },

            password: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            google_id: {
                type: DataTypes.STRING(100),
                allowNull: true,
                unique: true,
            },

            thumbnail: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },

            status: {
                type: DataTypes.SMALLINT,
                allowNull: false,
                defaultValue: USER_CONSTANTS.STATUS_NOT_ACTIVATED,
            },

            role_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: "roles", key: "id" },
                onDelete: "SET NULL"
            },

            last_login_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            last_login_ip: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            blocked_till: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            device_tokens: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
            },
        },
        {
            timestamps: true,
            paranoid: true,
            deletedAt: "deletedAt",
        }
    );

    Model.associate = (db) => {
        Model.belongsTo(db.Role, { foreignKey: "role_id", as: "_role" });
        Model.hasMany(db.UserSession, { foreignKey: "user_id", sourceKey: "id", as: "sessions" });
        Model.hasMany(db.UserLogin, { foreignKey: "user_id", sourceKey: "id", as: "last_logins" });
        Model.hasMany(db.UserLoginFail, { foreignKey: "user_id", sourceKey: "id", as: "login_fails" });
        Model.hasMany(db.UserNote, { foreignKey: "createdBy", as: "notes" });
        Model.hasMany(db.UserOtpSession, { foreignKey: "user_id", sourceKey: "id", as: "otp_sessions" });
        Model.hasMany(db.UserPositionAssignment, { foreignKey: "user_id", as: "position_assignments" });
    };

    return Model;
};