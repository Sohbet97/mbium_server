const { DataTypes } = require("sequelize");
const STATUSES = require("../../../utils/statuses");

module.exports = (sequelize) => {
    const Model = sequelize.define("positions", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "roles",
                key: 'id'
            }
        },
        seats: {
            type: DataTypes.SMALLINT,
            defaultValue: 1
        },
        room: {
            type: DataTypes.STRING(100)
        },
        type: {
            type: DataTypes.SMALLINT
        },
        order: {
            type: DataTypes.SMALLINT,
            allowNull: true
        },
        status: {
            type: DataTypes.SMALLINT,
            defaultValue: STATUSES.STATUSE_ACTIVE
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        timestamps: true,
        paranoid: true,
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Role, { foreignKey: "role_id", as: "role" });
        Model.hasMany(db.User, { foreignKey: "position", as: "users" });
    }

    return Model;
}