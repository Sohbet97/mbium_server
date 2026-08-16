const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('gift_creator_balances', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        gift_creator_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'gift_creators', key: 'id' },
            onDelete: 'CASCADE',
        },
        available_balance: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'TMT',
        },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { unique: true, fields: ['gift_creator_id'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.GiftCreator, { foreignKey: 'gift_creator_id', as: 'creator' })
    }

    return Model
}
