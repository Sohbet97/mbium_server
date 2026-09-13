const { DataTypes } = require('sequelize')

const ATTACHMENT_FILE_TYPES = {
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    EXCEL: 'EXCEL',
    WORD:  'WORD',
    PDF:   'PDF',
}

module.exports = (sequelize) => {
    const Model = sequelize.define('buyer_request_attachments', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        buyer_request_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'buyer_requests', key: 'id' },
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
            { fields: ['buyer_request_id'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.BuyerRequest, { foreignKey: 'buyer_request_id', as: 'request' })
    }

    return Model
}

module.exports.ATTACHMENT_FILE_TYPES = ATTACHMENT_FILE_TYPES
