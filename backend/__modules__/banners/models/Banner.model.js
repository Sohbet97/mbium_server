const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('banners', {
        id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        banner_type_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'banner_types', key: 'id' }, onDelete: 'SET NULL' },
        shop_id:        { type: DataTypes.INTEGER, allowNull: true,  references: { model: 'shops', key: 'id' }, onDelete: 'CASCADE' },
        title:          { type: DataTypes.STRING(255), allowNull: false },
        subtitle:       { type: DataTypes.TEXT },
        media_id:       { type: DataTypes.UUID, allowNull: true, references: { model: 'media', key: 'id' }, onDelete: 'SET NULL' },
        image_url:      { type: DataTypes.TEXT },
        button_text:    { type: DataTypes.STRING(100) },
        button_url:     { type: DataTypes.TEXT },
        link_url:       { type: DataTypes.TEXT },
        sort_order:     { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0, field: '"order"' },
        starts_at:      { type: DataTypes.DATE },
        ends_at:        { type: DataTypes.DATE },
        is_active:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['banner_type_id'] },
            { fields: ['shop_id'] },
            { fields: ['media_id'] },
            { fields: ['is_active'] },
            { fields: ['"order"'] },
        ],
    })

    Model.associate = (db) => {
        if (db.Shop)       Model.belongsTo(db.Shop,       { foreignKey: 'shop_id',        as: 'shop' })
        if (db.BannerType) Model.belongsTo(db.BannerType, { foreignKey: 'banner_type_id', as: 'banner_type' })
        if (db.Media)      Model.belongsTo(db.Media,      { foreignKey: 'media_id',       as: 'media' })
    }

    return Model
}
