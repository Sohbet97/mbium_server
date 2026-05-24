const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Model = sequelize.define("AuditLog", {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        entity_type: {
            type: DataTypes.STRING(60),
            allowNull: false,
        },
        entity_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        action: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        actor_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        ip_address: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: "audit_logs",
        timestamps: false,
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "actor_id", as: "actor" });
    };

    return Model;
};
