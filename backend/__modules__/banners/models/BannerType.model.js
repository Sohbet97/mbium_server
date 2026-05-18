const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('banner_types', {
        id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name:        { type: DataTypes.STRING(100), allowNull: false },
        name_ru:     { type: DataTypes.STRING(100) },
        name_eng:    { type: DataTypes.STRING(100) },
        slug:        { type: DataTypes.STRING(60),  allowNull: false, unique: true },
        description: { type: DataTypes.TEXT },
        is_active:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        timestamps: true,
        paranoid: false,
    })

    Model.associate = (db) => {
        Model.hasMany(db.Banner, { foreignKey: 'banner_type_id', as: 'banners' })
    }

    return Model
}
