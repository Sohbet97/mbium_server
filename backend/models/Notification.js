const { DataTypes } = require("sequelize")

module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define("notifications", {
        id: {
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        type:{
            type:DataTypes.SMALLINT
        },
        target_id:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        user: {
            type: DataTypes.UUID,
            onDelete: "SET NULL",
            references: {
                model: "users",
                key: 'id'
            }
        },
        status:{
            type:DataTypes.SMALLINT,
            defaultValue:0
        },
        content:{
            type:DataTypes.STRING(255)
        }
    }, {
        timestamps: true
    })
    return Notification
}