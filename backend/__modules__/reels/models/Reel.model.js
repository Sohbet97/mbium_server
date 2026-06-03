const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('reels', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'shops', key: 'id' },
            onDelete: 'CASCADE',
        },
        video_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'media', key: 'id' },
            onDelete: 'RESTRICT',
        },
        thumbnail_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'media', key: 'id' },
            onDelete: 'SET NULL',
        },
        caption: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'products', key: 'id' },
            onDelete: 'SET NULL',
        },
        view_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['shop_id'] },
            { fields: ['is_active'] },
            { fields: ['createdAt'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.Shop,    { foreignKey: 'shop_id',    as: 'shop' })
        Model.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' })
        if (db.Media) {
            Model.belongsTo(db.Media, { foreignKey: 'video_id',     as: 'video' })
            Model.belongsTo(db.Media, { foreignKey: 'thumbnail_id', as: 'thumbnail' })
        }
    }

    return Model
}
