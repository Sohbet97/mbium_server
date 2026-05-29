const { DataTypes } = require('sequelize')

module.exports = (sequelize, db) => {
    const Model = sequelize.define('Comment', {
        id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        product_id: { type: DataTypes.INTEGER, allowNull: false },
        user_id:    { type: DataTypes.UUID,    allowNull: false },
        parent_id:  { type: DataTypes.INTEGER, allowNull: true,  defaultValue: null },
        body:       { type: DataTypes.TEXT,    allowNull: false },
        status:     {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
    }, {
        tableName: 'comments',
        timestamps: true,
    })

    Model.associate = (db) => {
        Model.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' })
        Model.belongsTo(db.User,    { foreignKey: 'user_id',    as: 'author' })
        Model.belongsTo(db.Comment, { foreignKey: 'parent_id',  as: 'parent' })
        Model.hasMany(db.Comment,   { foreignKey: 'parent_id',  as: 'replies' })
    }

    return Model
}
