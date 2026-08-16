const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('gift_types', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        animation_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'media', key: 'id' },
            onDelete: 'RESTRICT',
        },
        icon_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'media', key: 'id' },
            onDelete: 'SET NULL',
        },
        effect_description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        price_coin: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        price_tmt: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        gift_creator_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'gift_creators', key: 'id' },
            onDelete: 'RESTRICT',
        },
        sort_order: {
            type: DataTypes.SMALLINT,
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
        paranoid: false,
        indexes: [
            { fields: ['is_active', 'sort_order'] },
            { fields: ['gift_creator_id'] },
        ],
    })

    Model.associate = (db) => {
        if (db.Media) {
            Model.belongsTo(db.Media, { foreignKey: 'animation_id', as: 'animation' })
            Model.belongsTo(db.Media, { foreignKey: 'icon_id', as: 'icon' })
        }
        if (db.GiftCreator) {
            Model.belongsTo(db.GiftCreator, { foreignKey: 'gift_creator_id', as: 'gift_creator' })
        }
    }

    return Model
}
