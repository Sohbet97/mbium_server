const { Op } = require("sequelize");
const { FUNCTIONS } = require("../utils/functions");
const db = require("../models");
const { STATUSE_ACTIVE } = require("../utils/statuses");

class VillageService {
    /**
     * 
     * @param {Object} req 
     * @returns Array of countries according by filter
     */
    static async get(filter = {}, limit = undefined, sort=undefined, skip=0){
        const data = await db.Village.findAll({
            where:filter,
            offset:skip, 
            order:[sort],
            limit:limit,
            include:[
                {
                    model:db.District,
                    as:'_district',
                    attributes:['name', 'type']
                }
            ]
        });
        return data;
    }

    static async getForFilter(){
        const data = await db.Village.findAll({
            attributes:{exclude:['createdBy', 'updatedAt']},
            where:{status:{[Op.eq]:STATUSE_ACTIVE}},
            order:[FUNCTIONS.getSort('order')],
            include:[
                {
                    model:db.District,
                    as:'_district',
                    attributes:['name', 'type']
                }
            ]
        });
        return data;
    }

    /**
     * 
     * @param {Object} req 
     * @returns Count of countries according by filter
     */
    static async getCount(filter = {}){
        const count = await db.Village.count({
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
        const model = await db.Village.findOne({
            where:{
                id:id
            },
            include:[
                {
                    model:db.District,
                    as:'_district',
                    attributes:['name', 'type']
                }
            ]
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
        const model = await db.Village.create({
            name:req.body?.name,
            ssu_code:req.body?.ssu_code,
            district:FUNCTIONS.getNumber(req.body?.district) || null,
            type:FUNCTIONS.getNumber(req.body?.type),
            status:FUNCTIONS.getNumber(req.body?.status),
            order:FUNCTIONS.getNumber(req.body?.order) || null,
            createdBy:req.user?.id
        });
        return model;
    }

    static async update(req, res){
    }

    static async delete(id){
        db.Village.destroy({where:{id}});
    }
}

module.exports = VillageService;