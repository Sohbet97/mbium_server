const { DataTypes } = require("sequelize");

module.exports  = (sequelize, Sequelize) =>{
    const Model = sequelize.define("chat_messages", {
        id: {
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        text:{
            type:DataTypes.STRING(500),
            allowNull:true
        },
        file:{
            type:DataTypes.STRING(500),
            allowNull:true
        },
        isVoice:{
            type:DataTypes.BOOLEAN,
            defaultValue:false
        },
        chatroom:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references: {
                model: 'chat_rooms',
                key: 'id'
            }
        },
        status:{
            type:DataTypes.SMALLINT,
            defaultValue:0,
        },
        type:{
            type:DataTypes.SMALLINT,
            defaultValue:0,
        },
        target:{
            type:DataTypes.ARRAY(DataTypes.STRING(100)),
            defaultValue:[]
        },
        read:{
            type:DataTypes.ARRAY(DataTypes.STRING(100)),
            defaultValue:[]
        },
        createdBy:{
            type:DataTypes.UUID,
            allowNull:false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        timestamps:true
    });
    return Model;
}