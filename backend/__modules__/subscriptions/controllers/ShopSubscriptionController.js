const ApiError = require("../../../exceptions/api-error");
const Validator = require("../../../__artefacts__/_validator_");
const { FUNCTIONS } = require("../../../utils/functions");
const ShopSubscriptionService = require("../services/ShopSubscriptionService");
const { subscriptionSchema } = require("../validators/plan.scheme");

class ShopSubscriptionController {
    static async getAll(req, res, next) {
        try {
            const filter = {};
            if (req.query.shop_id) filter.shop_id = Number(req.query.shop_id);
            if (req.query.status !== undefined) filter.status = Number(req.query.status);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                ShopSubscriptionService.getAll(filter, limit, skip),
                ShopSubscriptionService.getCount(filter),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getActiveForShop(req, res, next) {
        try {
            const model = await ShopSubscriptionService.getActiveForShop(req.params.shopId);
            return res.status(200).json({ model: model ?? null });
        } catch (e) { next(e); }
    }

    static async assign(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(subscriptionSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await ShopSubscriptionService.assign({
                ...req.body,
                assigned_by: req.user?.id,
            });
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async updateStatus(req, res, next) {
        try {
            const { status, note } = req.body;
            if (status === undefined) throw ApiError.BadRequest("status is required");
            const model = await ShopSubscriptionService.updateStatus(req.params.id, status, note);
            if (!model) throw ApiError.NotFound("Subscription not found");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async remove(req, res, next) {
        try {
            await ShopSubscriptionService.remove(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = ShopSubscriptionController;
