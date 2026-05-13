const { Op } = require("sequelize")
const { FUNCTIONS } = require("../utils/functions")
const db = require("../models")
const { STATUSE_ACTIVE } = require("../utils/statuses")

class DistrictService {
    static async get(filter = {}, limit = undefined, sort=FUNCTIONS.getSort('-createdAt'), skip=0){
        const data = await db.District.findAll({
            attributes:{exclude:['createdBy', 'updatedAt']},
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
        const data = await db.District.findAll({
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

    static async getCount(filter = {}){
        const count = await db.District.count({
            where:filter
        })
        return count
    }

    static async getById(id){
        const model = await db.District.findOne({
            where:{id},
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
        const model = await db.District.create({
            name:req.body?.name,
            ssu_code:req.body?.ssu_code,
            region:FUNCTIONS.getNumber(req.body?.region) || null,
            type:FUNCTIONS.getNumber(req.body?.type),
            status:FUNCTIONS.getNumber(req.body?.status),
            order:FUNCTIONS.getNumber(req.body?.order) || null,
            createdBy:req.user?.id
        })
        return model
    }

    static async delete(id){
        await db.District.destroy({where:{id}})
    }
}

module.exports = DistrictService