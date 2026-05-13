const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
    const Model = sequelize.define("user_login_fails", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            onDelete: "CASCADE",
            references: {
                model: "users",
                key: 'id'
            }
        },
    }, {
        timestamps: true,
        updatedAt: false
    });
    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id",  targetKey: "id", as: "_user" });
    }
    return Model;
}