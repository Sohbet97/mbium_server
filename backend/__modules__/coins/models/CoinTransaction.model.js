const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Model = sequelize.define("coin_transactions", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // positive = credit, negative = debit
        },
        type: {
            type: DataTypes.STRING(20),
            allowNull: false,
            // EARN | SPEND | WITHDRAW | REFUND | GRANT | DEDUCT
        },
        source: {
            type: DataTypes.STRING(50),
            allowNull: false,
            // ORDER | REVIEW | REFERRAL | TASK | AI | GIFT | MANUAL
        },
        reference_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        balance_after: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
        },
    }, {
        timestamps: true,
        updatedAt: false,
        paranoid: false,
        indexes: [
            { fields: ["user_id"] },
            { fields: ["created_at"] },
        ],
    });

    Model.associate = (db) => {
        Model.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
        Model.belongsTo(db.User, { foreignKey: "created_by", as: "admin" });
    };

    return Model;
};
