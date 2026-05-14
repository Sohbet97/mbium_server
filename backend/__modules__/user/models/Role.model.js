const { DataTypes } = require("sequelize");
const STATUSES = require("../../../utils/statuses");

module.exports = (sequelize) => {
    const Model = sequelize.define("roles", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        permissions: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            defaultValue: []
        },
        modules: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            defaultValue: []
        },
        start_page: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
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
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        timestamps: true,
        paranoid: true
    });
    Model.associate = (db) => {
        Model.hasMany(db.User, { as: "users", foreignKey: "role_id" });
    }
    return Model;
}