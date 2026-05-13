const { DataTypes } = require("sequelize")

module.exports = (sequelize, Sequelize) => {
    const Model = sequelize.define("logs", {
        id: {
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull:true
        },
        ipAddress: {
            type: DataTypes.STRING(255)
        },
        method: {
            type: DataTypes.STRING(255)
        },
        route: {
            type: DataTypes.STRING(255)
        },
        parameters: {
            type: DataTypes.TEXT
        },
        body: {
            type: DataTypes.TEXT
        },
        query: {
            type: DataTypes.TEXT
        },
        userId: {
            type: DataTypes.STRING(100)
        }
    }, {
        timestamps: true,
        updatedAt: false
    })
    return Model
}