const { FUNCTIONS } = require("../utils/functions")
const SystemDumpService = require("../services/system-dumps")
const ApiError = require("../exceptions/api-error")
const fs = require('fs')
const path = require('path')
const { Op } = require("sequelize")
const UserController = require("../__modules__/user/controllers/user-controller")
const PATH = path.join(__dirname, '../public/dumps/')

class SystemDumpController {
    //#region Routes
    static async get(req, res, next){
        try {
            const filter = this.getFilter(req.query)
            const {limit, sort, skip} = FUNCTIONS.getQueryParams(req)
            const data = await SystemDumpService.get(filter, limit, sort, skip)
            const count = await SystemDumpService.getCount(filter)
            return res.status(200).json({data, count})
        } catch (e) {
            next(e)
        }
    }

    static async getCount(req, res, next){
        try {
            const filter = this.getFilter(req.query)
            const count = await SystemDumpService.getCount(filter)
            return res.status(200).json({count})
        } catch (e) {
            next(e)
        }
    }

    static async getById(req, res, next){
        try {
            const model = await SystemDumpService.getById(req.params?.id)
            return res.status(200).json({model})
        } catch (e) {
            next(e)
        }
    }

    static async create(req, res, next){
        try {
            const password = req.body?.password
            if(!password) throw ApiError.BadRequest("It's not required parameters")
            const isTrue = await UserController.confirmUserByPassword(req.user?.id, password)
            if(!isTrue) throw ApiError.BadRequest("Password isn't correct")
            const model = await SystemDumpService.create()
            res.sendStatus(200)
            next()
        } catch (e) {
            next(e)
        }
    }

    static async delete(req, res, next){
        try {
            const model = await SystemDumpService.getById(req.params?.id)
            if(!model) throw ApiError.NotFound()
            const filename = path.join(PATH, model?.filename)
            await model.destroy();
            if(fs.existsSync(filename)) fs.unlinkSync(filename)
            res.sendStatus(200);
            next()
        } catch (e) {
            next(e)
        }
    }
    //#endregion
    //#region Utils
    static getFilter(params) {
        const filter = {}
        if(params){
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
module.exports = SystemDumpController