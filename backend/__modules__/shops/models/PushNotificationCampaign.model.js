const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Model = sequelize.define('push_notification_campaigns', {
        id:              { type: DataTypes.INTEGER,     autoIncrement: true, primaryKey: true },
        shop_id:         { type: DataTypes.INTEGER,     allowNull: true },
        created_by:      { type: DataTypes.UUID,        allowNull: false },
        title:           { type: DataTypes.STRING(200), allowNull: false },
        body:            { type: DataTypes.TEXT,        allowNull: false },
        image_url:       { type: DataTypes.TEXT,        allowNull: true },
        data:            { type: DataTypes.JSONB,       allowNull: true },
        status:          { type: DataTypes.SMALLINT,    allowNull: false, defaultValue: 0 }, // 0=pending 1=sent 2=failed
        recipient_count: { type: DataTypes.INTEGER,     allowNull: false, defaultValue: 0 },
        success_count:   { type: DataTypes.INTEGER,     allowNull: false, defaultValue: 0 },
        fail_count:      { type: DataTypes.INTEGER,     allowNull: false, defaultValue: 0 },
        sent_at:         { type: DataTypes.DATE,        allowNull: true },
    }, {
        timestamps: true,
        indexes: [
            { fields: ['shop_id'] },
            { fields: ['created_at'] },
        ],
    })

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: 'shop_id', as: 'shop' })
        Model.belongsTo(db.User, { foreignKey: 'created_by', as: 'sender' })
    }

    return Model
}
