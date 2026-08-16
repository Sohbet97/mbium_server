const { DataTypes } = require('sequelize')

const GIFT_CREATOR_TRANSACTION_TYPES = {
    GIFT_CREDIT: 'GIFT_CREDIT',
    COMMISSION: 'COMMISSION',
}

const GIFT_CREATOR_TRANSACTION_STATUSES = {
    AVAILABLE: 'AVAILABLE',
}

module.exports = (sequelize) => {
    const Model = sequelize.define('gift_creator_transactions', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        gift_creator_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'gift_creators', key: 'id' },
            onDelete: 'CASCADE',
        },
        type: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            // positive = credit; COMMISSION rows are negative and audit-only (never applied to balance)
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: GIFT_CREATOR_TRANSACTION_STATUSES.AVAILABLE,
        },
        balance_after: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        timestamps: true,
        paranoid: false,
        updatedAt: false,
        indexes: [
            { fields: ['gift_creator_id'] },
            { fields: ['type'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.GiftCreator, { foreignKey: 'gift_creator_id', as: 'creator' })
    }

    return Model
}

module.exports.GIFT_CREATOR_TRANSACTION_TYPES = GIFT_CREATOR_TRANSACTION_TYPES
module.exports.GIFT_CREATOR_TRANSACTION_STATUSES = GIFT_CREATOR_TRANSACTION_STATUSES
