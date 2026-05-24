const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Model = sequelize.define('shop_type_change_requests', {
        id:                 { type: DataTypes.INTEGER,   autoIncrement: true, primaryKey: true },
        shop_id:            { type: DataTypes.INTEGER,   allowNull: false, references: { model: 'shops',      key: 'id' }, onDelete: 'CASCADE' },
        current_type_id:    { type: DataTypes.INTEGER,   allowNull: false, references: { model: 'shop_types', key: 'id' } },
        requested_type_id:  { type: DataTypes.INTEGER,   allowNull: false, references: { model: 'shop_types', key: 'id' } },
        // 0 = pending, 1 = approved, 2 = rejected
        status:             { type: DataTypes.SMALLINT,  allowNull: false, defaultValue: 0 },
        note:               { type: DataTypes.TEXT,      allowNull: true },
        requested_by:       { type: DataTypes.UUID,      allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
        reviewed_by:        { type: DataTypes.UUID,      allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
        reviewed_at:        { type: DataTypes.DATE,      allowNull: true },
    }, {
        timestamps: true,
        indexes: [
            { fields: ['shop_id'] },
            { fields: ['status'] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.Shop,     { foreignKey: 'shop_id',           as: 'shop' });
        Model.belongsTo(db.ShopType, { foreignKey: 'current_type_id',   as: 'currentType' });
        Model.belongsTo(db.ShopType, { foreignKey: 'requested_type_id', as: 'requestedType' });
        Model.belongsTo(db.User,     { foreignKey: 'requested_by',      as: 'requester' });
        Model.belongsTo(db.User,     { foreignKey: 'reviewed_by',       as: 'reviewer' });
    };

    return Model;
};
