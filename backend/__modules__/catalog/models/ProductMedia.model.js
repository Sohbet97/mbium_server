const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('product_media', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'products', key: 'id' },
            onDelete: 'CASCADE',
        },
        media_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'media', key: 'id' },
            onDelete: 'CASCADE',
        },
        role: {
            type: DataTypes.ENUM('primary', 'gallery', 'video', '3d', '360', 'spin'),
            defaultValue: 'gallery',
        },
        sort_order: {
            type: DataTypes.SMALLINT,
            defaultValue: 0,
        },
    }, {
        timestamps: false,
        indexes: [
            { unique: true, fields: ['product_id', 'media_id'] },
            { fields: ['product_id'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.Product, { foreignKey: 'product_id' })
        if (db.Media) {
            Model.belongsTo(db.Media, { foreignKey: 'media_id', as: 'media' })
        }
    }

    return Model
}
