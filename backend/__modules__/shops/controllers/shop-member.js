const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const Validator = require("../../../__artefacts__/_validator_");
const ShopMemberService = require("../services/shop-members");
const shopMemberSchema = require("../validators/shop-member.scheme");

class ShopMemberController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = ShopMemberService.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                ShopMemberService.get(filter, limit, skip, paranoid),
                ShopMemberService.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await ShopMemberService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Dükan agzasy tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(shopMemberSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const existing = await ShopMemberService.getByShopAndUser(req.body.shop_id, req.body.user_id);
            if (existing) throw ApiError.Conflict("Bu ulanyjy bu dükanda eýýäm agza");

            const model = await ShopMemberService.create({
                ...req.body,
                invited_by: req.user?.id || null,
            });
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const existing = await ShopMemberService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Dükan agzasy tapylmady");
            const model = await ShopMemberService.update(req.params.id, req.body);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await ShopMemberService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await ShopMemberService.delete(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            await ShopMemberService.restore(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = ShopMemberController;
