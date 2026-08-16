const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('reel_gifts', {
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
        reel_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'reels', key: 'id' },
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'shops', key: 'id' },
        },
        gift_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'gift_types', key: 'id' },
        },
        gift_creator_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'gift_creators', key: 'id' },
        },
        price_coin: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        price_tmt: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        message: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        wallet_transaction_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'wallet_transactions', key: 'id' },
            onDelete: 'SET NULL',
        },
    }, {
        timestamps: true,
        paranoid: false,
        updatedAt: false,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['reel_id'] },
            { fields: ['shop_id'] },
            { fields: ['gift_creator_id'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' })
        Model.belongsTo(db.Reel, { foreignKey: 'reel_id', as: 'reel' })
        if (db.Shop) Model.belongsTo(db.Shop, { foreignKey: 'shop_id', as: 'shop' })
        Model.belongsTo(db.GiftType, { foreignKey: 'gift_type_id', as: 'gift_type' })
        Model.belongsTo(db.GiftCreator, { foreignKey: 'gift_creator_id', as: 'gift_creator' })
        if (db.WalletTransaction) {
            Model.belongsTo(db.WalletTransaction, { foreignKey: 'wallet_transaction_id', as: 'wallet_transaction' })
        }
    }

    return Model
}
