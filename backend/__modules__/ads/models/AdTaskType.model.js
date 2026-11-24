const { DataTypes } = require("sequelize");

// code ties a type to a backend action; only these three exist today
const AD_TASK_CODES = ["review", "reel_like", "shop_follow"];
const AD_TARGET_TYPES = ["shop", "product", "reel"];

module.exports = (sequelize) => {
    const Model = sequelize.define("ad_task_types", {
        id:               { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code:             { type: DataTypes.STRING(30), allowNull: false },
        name:             { type: DataTypes.STRING(150), allowNull: false },
        name_ru:          { type: DataTypes.STRING(150), allowNull: true },
        name_eng:         { type: DataTypes.STRING(150), allowNull: true },
        target_type:      { type: DataTypes.STRING(10), allowNull: false },
        min_price:        { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.10 },
        needs_moderation: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        status:           { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, { timestamps: true });

    return Model;
};

module.exports.AD_TASK_CODES = AD_TASK_CODES;
module.exports.AD_TARGET_TYPES = AD_TARGET_TYPES;
