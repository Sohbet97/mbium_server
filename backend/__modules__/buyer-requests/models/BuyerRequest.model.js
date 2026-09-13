const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('buyer_requests', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
        },
        city_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'cities', key: 'id' },
            onDelete: 'SET NULL',
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'products', key: 'id' },
            onDelete: 'SET NULL',
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'shops', key: 'id' },
            onDelete: 'SET NULL',
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        budget: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0, // 0=active, 1=closed
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['city_id'] },
            { fields: ['product_id'] },
            { fields: ['shop_id'] },
            { fields: ['status'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' })
        if (db.City) Model.belongsTo(db.City, { foreignKey: 'city_id', as: 'city' })
        if (db.Product) Model.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' })
        if (db.Shop) Model.belongsTo(db.Shop, { foreignKey: 'shop_id', as: 'shop' })
        if (db.BuyerRequestOffer) Model.hasMany(db.BuyerRequestOffer, { foreignKey: 'buyer_request_id', as: 'offers' })
        if (db.BuyerRequestAttachment) Model.hasMany(db.BuyerRequestAttachment, { foreignKey: 'buyer_request_id', as: 'attachments' })
    }

    return Model
}
