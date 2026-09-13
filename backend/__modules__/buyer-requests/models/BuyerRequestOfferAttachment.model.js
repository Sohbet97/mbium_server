const { DataTypes } = require('sequelize')
const { ATTACHMENT_FILE_TYPES } = require('./BuyerRequestAttachment.model')

module.exports = (sequelize) => {
    const Model = sequelize.define('buyer_request_offer_attachments', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        buyer_request_offer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'buyer_request_offers', key: 'id' },
            onDelete: 'CASCADE',
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        file_type: {
            type: DataTypes.STRING(20),
            allowNull: false, // IMAGE | VIDEO | EXCEL | WORD | PDF
        },
        mime_type: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        original_name: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        size: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
    }, {
        timestamps: true,
        updatedAt: false,
        indexes: [
            { fields: ['buyer_request_offer_id'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.BuyerRequestOffer, { foreignKey: 'buyer_request_offer_id', as: 'offer' })
    }

    return Model
}

module.exports.ATTACHMENT_FILE_TYPES = ATTACHMENT_FILE_TYPES
