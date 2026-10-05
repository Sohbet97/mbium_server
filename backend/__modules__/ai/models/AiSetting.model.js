module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize')

    const Model = sequelize.define('ai_settings', {
        id:                { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        coins_per_request: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    }, {
        timestamps: true,
        paranoid: false,
    })

    return Model
}
