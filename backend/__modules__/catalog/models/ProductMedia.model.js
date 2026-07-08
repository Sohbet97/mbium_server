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
        variant_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'product_variants', key: 'id' },
            onDelete: 'CASCADE',
            comment: 'NULL = shared product-level media; set = scoped to this variant (e.g. color)',
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
            { unique: true, fields: ['product_id', 'variant_id', 'media_id'] },
            { fields: ['product_id'] },
            { fields: ['variant_id'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.Product, { foreignKey: 'product_id' })
        if (db.Media) {
            Model.belongsTo(db.Media, { foreignKey: 'media_id', as: 'media' })
        }
        if (db.ProductVariant) {
            Model.belongsTo(db.ProductVariant, { foreignKey: 'variant_id', as: 'variant' })
        }
    }

    return Model
}
