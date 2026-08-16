const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('shop_follows', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'shops', key: 'id' },
        },
    }, {
        timestamps: true,
        paranoid: false,
        updatedAt: false,
        indexes: [
            { unique: true, fields: ['user_id', 'shop_id'] },
            { fields: ['user_id'] },
            { fields: ['shop_id'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' })
        Model.belongsTo(db.Shop, { foreignKey: 'shop_id', as: 'shop' })
    }

    return Model
}
