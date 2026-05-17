const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('media', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        filename: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true,
        },
        original_name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        mime_type: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
        size: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('image', 'video', '3d', '360'),
            allowNull: false,
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Relative path served as static, e.g. /media/images/uuid.jpg',
        },
        thumbnail_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        alt_text: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        width: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        height: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        duration: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Duration in seconds for video',
        },
        uploaded_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['type'] },
            { fields: ['uploaded_by'] },
        ],
    })

    Model.associate = (db) => {
        if (db.User) {
            Model.belongsTo(db.User, { foreignKey: 'uploaded_by', as: 'uploader' })
        }
        if (db.ProductMedia) {
            Model.hasMany(db.ProductMedia, { foreignKey: 'media_id', as: 'productMedia' })
        }
    }

    return Model
}
