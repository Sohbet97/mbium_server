const { Op } = require("sequelize")
const { FUNCTIONS } = require("../utils/functions")
const db = require("../models")
const { STATUSE_ACTIVE } = require("../utils/statuses")

class CityService {
    /**
     * 
     * @param {Object} req 
     * @returns Array of countries according by filter
     */
    static async get(filter = {}, limit = undefined, sort=undefined, skip=0){
        const data = await db.City.findAll({
            where:filter,
            offset:skip, 
            order:[sort],
            limit:limit,
            include:[
                {
                    model:db.Region,
                    as:'_region',
                    attributes:['name']
                }
            ]
        })
        return data
    }

    static async getForFilter(){
        const data = await db.City.findAll({
            attributes:{exclude:['createdBy', 'updatedAt']},
            where:{status:{[Op.eq]:STATUSE_ACTIVE}},
            order:[FUNCTIONS.getSort('order')],
            include:[
                {
                    model:db.Region,
                    as:'_region',
                    attributes:['name']
                }
            ]
        })
        return data
    }

    /**
     * 
     * @param {Object} req 
     * @returns Count of countries according by filter
     */
    static async getCount(filter = {}){
        const count = await db.City.count({
            where:filter
        })
        return count
    }

    /**
     * 
     * @param {String|number} id 
     * @returns Country model by given primary key
     */
    static async getById(id){
        const model = await db.City.findOne({
            where:{
                id:id
            },
            include:[
                {
                    model:db.Region,
                    as:'_region',
                    attributes:['name']
                }
            ]
        })
        return model
    }

    static async create(req){
        const model = await db.City.create({
            name:req.body?.name,
            code:req.body?.code,
            region:req.body?.region,
            status:FUNCTIONS.getNumber(req.body?.status),
            order:FUNCTIONS.getNumber(req.body?.order) || null,
            createdBy:req.user?.id
        })
        return model
    }

    static async delete(id){
        db.City.destroy({where:{id}})
    }
}

module.exports = CityService