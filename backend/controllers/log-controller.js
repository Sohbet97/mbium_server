const { Op } = require("sequelize")
const { FUNCTIONS } = require("../utils/functions")
const LogService = require("../services/logs")
const db = require("../models")

class LogController {
    //#region routes
    static async get(req, res, next){
        try {
            const filter = this.getFilter(req.query)
            const {limit, sort, skip} = FUNCTIONS.getQueryParams(req)
            const data = await LogService.get(filter, limit, sort, skip)
            const count = await LogService.getCount(filter)
            return res.status(200).json({data, count})
        } catch (e) {
            next(e)
        }
    }

    static async getFilterElements(req, res, next){
        try {
            const statuses = await db.Log.findAll({
                attributes:['status'],
                group:['status'],
                order:[FUNCTIONS.getSort('status')]
            })
            const routes = await db.Log.findAll({
                attributes:['route'],
                group:['route'],
                order:[FUNCTIONS.getSort('route')]
            })
            return res.status(200).json({
                statuses,
                routes
            })
        } catch (e) {
            next(e)
        }
    }

    static async getCount(req, res, next){
        try {
            const filter = this.getFilter(req.query)
            const count = await LogService.getCount(filter)
            return res.status(200).json({count})            
        } catch (e) {
            next(e)
        }
    }

    static async getById(req, res, next){
        try {
            const model = await LogService.getById(req.params.id)
            return res.status(200).json({model})
        } catch (e) {
            next(e)
        }
    }

    static async delete(req, res, next){
        try {
            const filter = this.getFilter(req.query)
            await LogService.delete(filter)
            res.sendStatus(200)
            next()
        } catch (e) {
            next(e)
        }
    }
    //#endregion

    //#region utils
    static getFilter(params){
        const filter = {}
        if(params){
            if(params.text){
                filter[Op.or] = [
                    {route:{[Op.iLike]:`%${params.text}%`}},
                    {parameters:{[Op.iLike]:`%${params.text}%`}},
                    {body:{[Op.iLike]:`%${params.text}%`}},
                    {query:{[Op.iLike]:`%${params.text}%`}}
                ]
            }
            if(params.method) filter.method = {[Op.eq]:params.method}
            if(params.status) filter.status = {[Op.eq]:params.status}
            if(params.route) filter.route = {[Op.eq]:params.route}

            
            if(params.start_date && params.start_date != null){
                if(params?.end_date && params.end_date != null){
                    filter.createdAt = {[Op.and]:[
                        {[Op.gte]:params.start_date},
                        {[Op.lte]:params.end_date}
                    ]}
                }else{
                    filter.createdAt = {[Op.gte]:params.start_date}
                }
            }else  if(params.end_date && params.end_date != null){
                filter.createdAt = {[Op.lte]:params.end_date}
            }
        }
        return filter
    }
    //#endregion

}
module.exports = LogController