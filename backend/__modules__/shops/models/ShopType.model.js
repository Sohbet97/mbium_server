const { DataTypes } = require("sequelize");
const STATUSES = require("../../../utils/statuses");

module.exports = (sequelize) => {
    const Model = sequelize.define("shop_types", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        name_ru: {
            type: DataTypes.STRING(500)
        },
        name_eng: {
            type: DataTypes.STRING(500)
        },
        order: {
            type: DataTypes.SMALLINT,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        commission_rate: {
            type: DataTypes.DECIMAL(5, 4),
            allowNull: false,
            defaultValue: 0.15
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
        Model.hasMany(db.Shop, { as: "shops", foreignKey: "type_id" });
        Model.belongsTo(db.User, { as: "creator", foreignKey: "createdBy" });
    }
    return Model;
}