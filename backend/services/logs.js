const db = require("../models");

class LogService {
    static async get(filter = {}, limit = undefined, sort=undefined, skip=0){
        const data = await db.Log.findAll({
            where:filter,
            offset:skip, 
            order:[sort],
            limit:limit
        });
        return data;
    }
    
    static async getCount(filter = {}){
        const count = await db.Log.count({
            where:filter
        });
        return count;
    }
    
    static async getById(id){
       const model = await db.Log.findOne({
           where:{
               id:id
            }
        });
        return model;
    }

    static async delete(filter){
        await db.Log.destroy({where:filter});
    }
    
}

module.exports = LogService;