const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('reel_likes', {
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
    }, {
        timestamps: true,
        paranoid: false,
        updatedAt: false,
        indexes: [
            { unique: true, fields: ['user_id', 'reel_id'] },
            { fields: ['user_id'] },
            { fields: ['reel_id'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' })
        Model.belongsTo(db.Reel, { foreignKey: 'reel_id', as: 'reel' })
    }

    return Model
}
