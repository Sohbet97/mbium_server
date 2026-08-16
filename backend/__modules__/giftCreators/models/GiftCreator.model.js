const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('gift_creators', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        avatar_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'media', key: 'id' },
            onDelete: 'SET NULL',
        },
        contact_note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { fields: ['is_active'] },
        ],
    })

    Model.associate = (db) => {
        if (db.Media) {
            Model.belongsTo(db.Media, { foreignKey: 'avatar_id', as: 'avatar' })
        }
        if (db.GiftCreatorBalance) {
            Model.hasOne(db.GiftCreatorBalance, { foreignKey: 'gift_creator_id', as: 'balance' })
        }
    }

    return Model
}
