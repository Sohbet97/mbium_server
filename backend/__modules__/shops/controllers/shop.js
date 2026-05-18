//#region Imports
const { Op } = require("sequelize");
const ApiError = require("../../../exceptions/api-error");
const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const Validator = require("../../../__artefacts__/_validator_");
const ShopService = require("../services/shops");
const shopSchema = require("../validators/shop.scheme");
const NotificationService = require("../../../services/notifications");
//#endregion

class ShopController {
    //#region routes
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = await this.getFilter(req.query);
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
            const data = await ShopService.get(filter, limit, sort, skip, paranoid);
            const count = await ShopService.getCount(filter, paranoid);
            return res.status(200).json({ data, count });
        } catch (e) {
            next(e);
        }
    }

    static async getCount(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = await this.getFilter(req.query);
            const count = await ShopService.getCount(filter, paranoid);
            return res.status(200).json({ count });
        } catch (e) {
            next(e);
        }
    }

    static async getById(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const model = await ShopService.getById(req?.params?.id, paranoid);
            if (!model) throw ApiError.NotFound("Brand not found");
            return res.status(200).json({ model });
        } catch (e) {
            next(e);
        }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(shopSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await ShopService.create(req);
            res.status(201).json({ model });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async update(req, res, next) {
        try {
            const existing = await ShopService.getById(req?.params?.id);
            if (!existing) throw ApiError.NotFound("Dükan tapylmady");

            const { isError, errors } = await Validator.validate(shopSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            await ShopService.update(req.params.id, req);
            const model = await ShopService.getById(req.params.id);
            res.status(200).json({ model });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async delete(req, res, next) {
        try {
            await ShopService.delete(req.params.id);
            res.sendStatus(200);
            next();
        } catch (e) {
            next(e);
        }
    }

    static async forceDelete(req, res, next) {
        try {
            await ShopService.delete(req.params.id, true);
            res.sendStatus(200);
            next();
        } catch (e) {
            next(e);
        }
    }

    static async submitForReview(req, res, next) {
        try {
            const model = await ShopService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Dükan tapylmady");
            const updated = await ShopService.submitForReview(req.params.id);
            NotificationService.createForShopReview(model, req.app.io).catch(() => {});
            return res.status(200).json({ model: updated });
        } catch (e) { next(e); }
    }

    static async verify(req, res, next) {
        try {
            const model = await ShopService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Dükan tapylmady");
            const updated = await ShopService.verify(req.params.id, req.user?.id);
            return res.status(200).json({ model: updated });
        } catch (e) { next(e); }
    }

    static async reject(req, res, next) {
        try {
            const model = await ShopService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Dükan tapylmady");
            const updated = await ShopService.reject(req.params.id, req.user?.id, req.body?.note, req.app.io);
            return res.status(200).json({ model: updated });
        } catch (e) { next(e); }
    }

    // ── Public self-service ───────────────────────────────────────────────────

    static async applyForShop(req, res, next) {
        try {
            const existing = await ShopService.getByOwner(req.user.id);
            if (existing) throw ApiError.BadRequest("Sizde eýýäm dükan bar");
            const { isError, errors } = await Validator.validate(shopSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await ShopService.create(req);
            const submitted = await ShopService.submitForReview(model.id);
            NotificationService.createForShopReview(submitted, req.app.io).catch(() => {});
            return res.status(201).json({ model: submitted });
        } catch (e) { next(e); }
    }

    static async getMyShop(req, res, next) {
        try {
            const model = await ShopService.getByOwner(req.user.id);
            return res.status(200).json({ model: model || null });
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            const id = req.params?.id;
            if (!id) throw ApiError.BadRequest('Id parameter is required');
            const model = await db.Shop.findOne({ where: { id }, paranoid: false });
            if (!model) throw ApiError.NotFound("Brand not found");
            if (model && model?.deletedAt) await model.restore();
            res.sendStatus(200);
            next();
        } catch (e) {
            next(e);
        }
    }
    //#endregion

    //#region utils
    static async getFilter(params) {
        const { text, is_active, paranoid } = params || {};
        const filter = {};
        if (text) {
            filter[Op.or] = [
                { name: { [Op.iLike]: `%${params.text}%` } },
                { name_ru: { [Op.iLike]: `%${params.text}%` } },
                { name_eng: { [Op.iLike]: `%${params.text}%` } },
            ];
        }
        if (is_active) filter.is_active = { [Op.eq]: is_active };
        if (paranoid) filter.deletedAt = { [Op.ne]: null };
        return filter;
    }
    //#endregion
}

module.exports = ShopController;