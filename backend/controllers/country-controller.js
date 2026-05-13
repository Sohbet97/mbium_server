const ApiError = require("../exceptions/api-error");
const db = require("../models");
const CountryService = require("../services/countries");
const { FUNCTIONS } = require("../utils/functions");
const STATUSES = require("../utils/statuses");

class CountryController {
    static async getAll(req, res, next) {
        try {
            const data = await CountryService.get(req)
            const count = await CountryService.getCount(req)
            return res.status(200).json({
                data,
                count
            });
        } catch (e) {
            next(e);
        }
    }

    static async getCount(req, res, next) {
        try {
            const count = await CountryService.getCount(req);
            return res.status(200).json({ count });
        } catch (e) {
            next(e);
        }
    }

    static async getById(req, res, next) {
        try {
            const model = await CountryService.getById(req.params.id);
            if (!model) throw ApiError.NotFound();
            return res.status(200).json({ model });
        } catch (e) {
            next(e);
        }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await CountryService.validate(req.body);
            if (isError) {
                throw ApiError.BadRequest(undefined, errors);
            }
            const model = await CountryService.create(req);
            await this.sync(model?.id, req?.user?.user)
            res.status(200).json({ model });
            next()
        } catch (e) {
            next(e);
        }
    }

    static async update(req, res, next) {
        try {
            const model = await CountryService.getById(req.params.id);
            if (!model) throw ApiError.NotFound();
            model.name = req.body?.name;
            model.code = req.body?.code;
            model.ssu_code = req.body?.ssu_code;
            model.order = FUNCTIONS.getNumber(req.body?.order);
            model.status = FUNCTIONS.getNumber(req.body?.status);
            const { isError, errors } = await CountryService.validate(model);
            if (isError) throw ApiError.BadRequest(undefined, errors);
            await model.save();
            await this.sync(model?.id, req?.user?.user);
            res.status(200).json({ model });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async deleteById(req, res, next) {
        try {
            await CountryService.delete(req.params.id);
            res.sendStatus(200);
            next();
        } catch (e) {
            next(e);
        }
    }

    static async sync(id, user) {
        return;
    }
}

module.exports = CountryController;