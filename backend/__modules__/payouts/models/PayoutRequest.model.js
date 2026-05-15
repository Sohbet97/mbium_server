const { DataTypes } = require("sequelize");

const PAYOUT_REQUEST_STATUSES = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    PROCESSED: "PROCESSED",
};

module.exports = (sequelize) => {
    const Model = sequelize.define("payout_requests", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "shops", key: "id" },
            onDelete: "RESTRICT",
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: "TMT",
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: PAYOUT_REQUEST_STATUSES.PENDING,
        },
        bank_details: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        requested_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
        processed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        processed_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
    }, {
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ["shop_id"] },
            { fields: ["status"] },
            { fields: ["requested_by"] },
        ],
    });

    Model.associate = (db) => {
        if (db.Shop) {
            Model.belongsTo(db.Shop, { foreignKey: "shop_id", as: "shop" });
        }
        if (db.User) {
            Model.belongsTo(db.User, { foreignKey: "requested_by", as: "requester" });
            Model.belongsTo(db.User, { foreignKey: "processed_by", as: "processor" });
        }
    };

    return Model;
};

module.exports.PAYOUT_REQUEST_STATUSES = PAYOUT_REQUEST_STATUSES;
