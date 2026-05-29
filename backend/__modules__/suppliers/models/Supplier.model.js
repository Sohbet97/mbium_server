const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("suppliers", {
        id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name:         { type: DataTypes.STRING(200), allowNull: false },
        contact_name: { type: DataTypes.STRING(200), allowNull: true },
        email:        { type: DataTypes.STRING(200), allowNull: true },
        phone:        { type: DataTypes.STRING(50),  allowNull: true },
        address:      { type: DataTypes.TEXT,        allowNull: true },
        country_id:   { type: DataTypes.INTEGER,     allowNull: true, references: { model: "countries", key: "id" } },
        website:      { type: DataTypes.STRING(500), allowNull: true },
        is_active:    { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: true },
        notes:        { type: DataTypes.TEXT,        allowNull: true },
    }, {
        timestamps: true,
        paranoid: false,
        indexes: [{ fields: ["is_active"] }],
    });

    Model.associate = (db) => {
        if (db.Country) Model.belongsTo(db.Country, { foreignKey: "country_id", as: "country" });
        Model.hasMany(db.Product, { foreignKey: "supplier_id", as: "products" });
    };

    return Model;
};
