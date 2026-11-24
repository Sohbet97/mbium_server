const { DataTypes } = require("sequelize");

// Text pages shown to app users (privacy policy, later terms/about), one row per slug.
// Content is Markdown in three languages; it is rendered to HTML on read.
module.exports = (sequelize) => {
    const Model = sequelize.define("static_pages", {
        id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        slug:        { type: DataTypes.STRING(64), allowNull: false, unique: true },
        title:       { type: DataTypes.STRING(255), allowNull: false },
        title_ru:    { type: DataTypes.STRING(255), allowNull: true },
        title_eng:   { type: DataTypes.STRING(255), allowNull: true },
        content:     { type: DataTypes.TEXT, allowNull: true },
        content_ru:  { type: DataTypes.TEXT, allowNull: true },
        content_eng: { type: DataTypes.TEXT, allowNull: true },
        is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        updatedBy:   { type: DataTypes.UUID, allowNull: true, references: { model: "users", key: "id" } },
    }, {
        timestamps: true,
    });

    return Model;
};
