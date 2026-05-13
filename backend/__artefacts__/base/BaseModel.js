const { DataTypes } = require("sequelize");

/**
 * commonFields — shared column definitions injected into every model.
 * Spread these into your model's attributes object.
 *
 * @example
 * const { commonFields } = require("../../base/BaseModel");
 * module.exports = (sequelize) => {
 *   const Model = sequelize.define("shops", {
 *     ...commonFields,
 *     name: { type: DataTypes.STRING(255), allowNull: false },
 *   }, commonOptions);
 *   ...
 * };
 */
const commonFields = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    order: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    createdBy: {
        type: DataTypes.UUID,
        references: { model: "users", key: "id" },
    },
};

/**
 * commonOptions — shared sequelize model options.
 * Spread or merge into your own options object.
 */
const commonOptions = {
    timestamps: true,
    paranoid: true,
};

/**
 * commonAssociations — call inside Model.associate to wire the creator relation.
 * @param {import("sequelize").Model} Model
 * @param {object} db
 */
function commonAssociations(Model, db) {
    Model.belongsTo(db.User, { as: "creator", foreignKey: "createdBy" });
}

module.exports = { commonFields, commonOptions, commonAssociations };
