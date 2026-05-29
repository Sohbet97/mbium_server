const { DataTypes } = require('sequelize')

module.exports = (sequelize, db) => {
    const Model = sequelize.define('KycDocument', {
        id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id:     { type: DataTypes.INTEGER, allowNull: false, references: { model: 'shops', key: 'id' } },
        type:        {
            type: DataTypes.ENUM('PASSPORT', 'TAX_ID', 'BUSINESS_REG', 'BANK_STATEMENT', 'OTHER'),
            allowNull: false,
        },
        file_url:    { type: DataTypes.TEXT, allowNull: false },
        status:      {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
        reviewed_by: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
        reviewed_at: { type: DataTypes.DATE, allowNull: true },
        note:        { type: DataTypes.TEXT, allowNull: true },
    }, {
        tableName: 'kyc_documents',
        timestamps: true,
    })

    Model.associate = (db) => {
        Model.belongsTo(db.Shop, { foreignKey: 'shop_id',     as: 'shop' })
        Model.belongsTo(db.User, { foreignKey: 'reviewed_by', as: 'reviewer' })
    }

    return Model
}
