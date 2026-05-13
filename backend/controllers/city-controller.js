const { Op } = require("sequelize")
const ApiError = require("../exceptions/api-error")
const { FUNCTIONS } = require("../utils/functions")
const db = require("../models")
const CityService = require("../services/cities")

class CityController {
    //#region  routes
    static async get(req, res, next){
        try {
            const filter = await this.getFilter(req.query)
            const {limit, sort, skip} = FUNCTIONS.getQueryParams(req)
            const data = await CityService.get(filter, limit, sort, skip)
            const count = await CityService.getCount(filter)
            return res.status(200).json({data, count})
        } catch (e) {
            next(e)
        }
    }

    static async getCount(req, res, next){
        try {
            const filter = await this.getFilter(req.query)
            const count = await CityService.getCount(filter)
            return res.status(200).json({count})
        } catch (e) {
            next(e)
        }
    }

    static async getById(req, res, next){
        try {
            const model = await CityService.getById(req.params.id)
            return res.status(200).json({model})
        } catch (e) {
            next(e)
        }
    }

    static async create(req, res, next){
        try {
            const {isError, errors} = await this.validate(req.body)
            if(isError){
                throw ApiError.BadRequest(null, errors)
            }
            const model = await CityService.create(req)
            res.status(200).json({model})
            next()
        } catch (e) {
            next(e)
        }
    }

    static async update(req, res, next){
        try {
            const model = await CityService.getById(req.params?.id)
            if(!model) throw ApiError.NotFound()
            model.name = req.body?.name
            model.code = req.body?.code
            model.region = req.body?.region
            model.order = FUNCTIONS.getNumber(req.body?.order) || null
            model.status = FUNCTIONS.getNumber(req.body?.status)
            const {isError, errors} = await this.validate(model, true)
            if(isError) throw ApiError.BadRequest(null, errors)
            await model.save()
            res.status(200).json({model})
            next()
        } catch (e) {
            next(e)
        }
    }

    static async delete(req, res, next){
        try {
            await CityService.delete(req.params.id)
            res.sendStatus(200)
            next()
        } catch (e) {
            next(e)
        }
    }
    //#endregion

    //#region utils
    static async getFilter(params){
        const filter = {}
        if(params){
            if(params.text){
                filter[Op.or] = [
                    {name:{[Op.iLike]:`%${params.text}%`}}
                ]
            }
            if(params.region){
                filter.region = {[Op.eq]:params.region}
            }
            
            if(!isNaN(Number(params?.status))) filter.status = {[Op.eq]:params.status}
        }
        return filter
    }
    
    static async validate(form, isUpdate = false){
        let errors = {}
        if(!FUNCTIONS.checkRequire(form?.name)){
            errors.name='Şäher ady boş bolup bilmez!'
        } 
        if(!isUpdate){
            const oldModel = await db.Village.findOne({
                where:{
                    [Op.and]:{
                        name:{[Op.eq]:form?.name},
                        id: (form?.id ?  {[Op.ne]: form?.id} : {[Op.gt]:0})
                    }
                }
            })
            if(oldModel && oldModel != null){
                errors.name = `${form?.name} atly şäher ozal hasaba alnan!`
            }
        }
    
        if(!FUNCTIONS.checkRequire(form?.region)){
            errors.region='Şäheriň haýsy welaýata degişlidigini saýlaň!'
        }else if(!db.Region.findOne({where:{id:{[Op.eq]:form.region}}})){
            errors.region='Şäheriň haýsy welaýata degişlidigini dogry saýlaň!'
        }else{
            errors.region = null
        }

        if(FUNCTIONS.checkRequire(form?.order) && form.order > 255){
            errors.order = 'Tertip belgisi 255-den uly bolmaly däl!'
        }
        
        return {isError:errors.name || errors.region || errors.order, errors}
    }
    //#endregion
}

module.exports = CityController