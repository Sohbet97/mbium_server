const { DataTypes } = require("sequelize");

const GUIDE_STATUSES = { DRAFT: 0, PUBLISHED: 1 };

module.exports = (sequelize) => {
    const Model = sequelize.define("guides", {
        id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        title:           { type: DataTypes.STRING(255), allowNull: false },
        title_ru:        { type: DataTypes.STRING(255), allowNull: true },
        title_eng:       { type: DataTypes.STRING(255), allowNull: true },
        description:     { type: DataTypes.TEXT, allowNull: true },
        description_ru:  { type: DataTypes.TEXT, allowNull: true },
        description_eng: { type: DataTypes.TEXT, allowNull: true },
        video:           { type: DataTypes.TEXT, allowNull: true },
        thumbnail:       { type: DataTypes.TEXT, allowNull: true },
        order:           { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
        status:          { type: DataTypes.SMALLINT, allowNull: false, defaultValue: GUIDE_STATUSES.DRAFT },
    }, {
        timestamps: true,
        indexes: [{ fields: ["status", "order"] }],
    });

    return Model;
};

module.exports.GUIDE_STATUSES = GUIDE_STATUSES;
