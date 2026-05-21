module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize')

    const Model = sequelize.define('ai_recommendations', {
        id:          { type: DataTypes.INTEGER,     autoIncrement: true, primaryKey: true },
        title_tk:    { type: DataTypes.STRING(255), allowNull: false },
        title_ru:    { type: DataTypes.STRING(255), allowNull: false },
        title_en:    { type: DataTypes.STRING(255), allowNull: false },
        subtitle_tk: { type: DataTypes.STRING(255), allowNull: true },
        subtitle_ru: { type: DataTypes.STRING(255), allowNull: true },
        subtitle_en: { type: DataTypes.STRING(255), allowNull: true },
        emoji:       { type: DataTypes.STRING(10),  allowNull: true },
        prompt:      { type: DataTypes.TEXT,        allowNull: false },
        sort_order:  { type: DataTypes.INTEGER,     allowNull: false, defaultValue: 0 },
        is_active:   { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: true },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { fields: ['is_active'] },
            { fields: ['sort_order'] },
        ],
    })

    return Model
}
