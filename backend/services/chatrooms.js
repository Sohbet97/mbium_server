const db = require("../models")
const { FUNCTIONS } = require("../utils/functions")

class ChatRoomService {
    static async get(filter = {}, limit = undefined, sort=FUNCTIONS.getSort('createdBy'), skip=0){
        const data = await db.ChatRoom.findAll({
            where:filter,
            offset:skip, 
            order:[sort],
            limit:limit
        })
        return data
    }

    static async getCount(filter = {}){
        const count = await db.ChatRoom.count({
            where:filter
        })
        return count
    }

    static async getById(id){
        const model = await db.ChatRoom.findOne({
            where:{id}
        })
        return model
    }

    static async delete(id){
        db.ChatRoom.destroy({where:{id}})
    }
}

module.exports = ChatRoomService