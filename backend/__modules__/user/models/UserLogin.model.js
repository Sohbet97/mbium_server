const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
    const Model = sequelize.define("user_logins", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        device_info: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        ip: {
            type: DataTypes.STRING(100)
        },
        user_id: {
            type: DataTypes.UUID,
            onDelete: "CASCADE",
            references: {
                model: "users",
                key: 'id'
            }
        }
    }, {
        timestamps: false
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", targetKey: "id", as: "_user" });
    }
    return Model;
}