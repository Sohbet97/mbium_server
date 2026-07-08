const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("sizes", {
        id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name:       { type: DataTypes.STRING(200), allowNull: false },
        name_ru:    { type: DataTypes.STRING(200), allowNull: true },
        name_eng:   { type: DataTypes.STRING(200), allowNull: true },
        slug:       { type: DataTypes.STRING(220), allowNull: false, unique: true },
        parent_id:  { type: DataTypes.INTEGER, allowNull: true, references: { model: "sizes", key: "id" } },
        is_active:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { fields: ["slug"], unique: true },
            { fields: ["parent_id"] },
            { fields: ["is_active"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(Model, { foreignKey: "parent_id", as: "parent" });
        Model.hasMany(Model,   { foreignKey: "parent_id", as: "children" });
        if (db.ProductVariantSize) {
            Model.hasMany(db.ProductVariantSize, { foreignKey: "size_id", as: "variantSizes" });
        }
    };

    return Model;
};
