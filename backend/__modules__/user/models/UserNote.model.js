const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
    const Model = sequelize.define("user_notes", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        date: {
            type: DataTypes.DATEONLY,
            defaultValue: DataTypes.NOW
        },
        time: {
            type: DataTypes.TIME,
            allowNull: true
        },
        title: {
            type: DataTypes.STRING(100)
        },
        description: {
            type: DataTypes.STRING(255)
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: 0
        },
        color: {
            type: DataTypes.STRING(10)
        },
        createdBy: {
            type: DataTypes.UUID,
            onDelete: "CASCADE",
            references: {
                model: "users",
                key: 'id'
            }
        }
    }, {
        timestamps: true
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "createdBy", as: "_user" });
    }
    return Model;
}