const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("delivers", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        first_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        avatar: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        city_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "cities", key: "id" },
        },
        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },
        phones: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["city_id"] },
            { fields: ["status"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.City, { foreignKey: "city_id", as: "city" });
    };

    return Model;
};
