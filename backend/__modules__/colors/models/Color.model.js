const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("colors", {
        id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name:       { type: DataTypes.STRING(200), allowNull: false },
        name_ru:    { type: DataTypes.STRING(200), allowNull: true },
        name_eng:   { type: DataTypes.STRING(200), allowNull: true },
        slug:       { type: DataTypes.STRING(220), allowNull: false, unique: true },
        // Lower-case #rrggbb. Referenced directly by products.color_hex and
        // product_variants.color_hex, so colour filtering needs no join.
        hex:        {
            type: DataTypes.CHAR(7),
            allowNull: false,
            unique: true,
            validate: { is: /^#[0-9a-f]{6}$/ },
        },
        is_active:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [
            { fields: ["slug"], unique: true },
            { fields: ["hex"], unique: true },
            { fields: ["is_active"] },
        ],
    });

    Model.associate = (db) => {
        if (db.Product) {
            Model.hasMany(db.Product, { foreignKey: "color_hex", sourceKey: "hex", as: "products" });
        }
        if (db.ProductVariant) {
            Model.hasMany(db.ProductVariant, { foreignKey: "color_hex", sourceKey: "hex", as: "variants" });
        }
    };

    return Model;
};
