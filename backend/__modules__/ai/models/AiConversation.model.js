module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize')

    const Model = sequelize.define('ai_conversations', {
        id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id:  { type: DataTypes.UUID,    allowNull: false },
        title:    { type: DataTypes.STRING(200), allowNull: false, defaultValue: 'New chat' },
        messages: { type: DataTypes.JSONB,   allowNull: false, defaultValue: [] },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['createdAt'] },
        ],
    })

    return Model
}
