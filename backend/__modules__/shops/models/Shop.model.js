const { DataTypes } = require("sequelize");
const STATUSES = require("../../../utils/statuses");
const SHOP_STATUSES = require("../utils/shop.statuses");

module.exports = (sequelize) => {
    const Model = sequelize.define("roles", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'shop_types',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING(255),
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
        Model.belongsTo(db.User, { as: "creator", foreignKey: "createdBy" });
        Model.belongsTo(db.ShopType, { as: "type", foreignKey: "type_id" });
    }
    return Model;
}