const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");

class UserNoteService {
    /**
     * 
     * @param {Object} req 
     * @returns Array of countries according by filter
     */
    static async get(filter = {}, limit = undefined, sort=FUNCTIONS.getSort('-createdAt'), skip=0){
        const data = await db.UserNote.findAll({
            where:filter,
            offset:skip, 
            order:[sort],
            limit:limit
        });
        return data;
    }

    /**
     * 
     * @param {Object} req 
     * @returns Count of countries according by filter
     */
    static async getCount(filter = {}){
        const count = await db.UserNote.count({
            where:filter
        });
        return count;
    }

    /**
     * 
     * @param {String|number} id 
     * @returns Country model by given primary key
     */
    static async getById(id){
        const model = await db.UserNote.findOne({
            where:{
                id:id
            }
        });
        return model;
    }

    /**
     * 
     * @param {object} req
     * @description Creates model with given params and returns created model  
     * @returns Country model
     */
    static async create(req){
        const model = await db.UserNote.create({
            date:req.body?.date,
            time:req.body?.time || null,
            title:req.body?.title,
            description:req.body?.description,
            status:req.body?.status,
            color:req.body?.color,
            createdBy:req.user?.id
        });
        return model;
    }

    static async delete(id){
        db.UserNote.destroy({where:{id}});
    }
}

module.exports = UserNoteService;