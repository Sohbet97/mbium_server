const { Op } = require("sequelize");
const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const Validator = require("../../../__artefacts__/_validator_");
const OrderService = require("../services/orders");
const { orderSchema, shipmentSchema } = require("../validators/order.schema");
const NotificationService = require("../../../services/notifications");

class OrderController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = this.getFilter(req.query, req.user);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                OrderService.get(filter, limit, skip, paranoid),
                OrderService.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await OrderService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Sargyt tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(orderSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await OrderService.create(req.user?.id, req.body);
            NotificationService.createForOrder(model, req.app.io).catch(() => {});
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async updateStatus(req, res, next) {
        try {
            const { status, note } = req.body;
            if (status === undefined) throw ApiError.BadRequest("Status talap edilýär");
            const order = await OrderService.getById(req.params.id);
            if (!order) throw ApiError.NotFound("Sargyt tapylmady");
            await OrderService.updateStatus(req.params.id, status, note, req.user?.id);
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async addPayment(req, res, next) {
        try {
            const order = await OrderService.getById(req.params.id);
            if (!order) throw ApiError.NotFound("Sargyt tapylmady");
            const payment = await OrderService.addPayment(req.params.id, req.body);
            return res.status(201).json({ model: payment });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await OrderService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await OrderService.delete(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async getShipments(req, res, next) {
        try {
            const order = await OrderService.getById(req.params.id);
            if (!order) throw ApiError.NotFound("Sargyt tapylmady");
            const data = await OrderService.getShipments(req.params.id);
            return res.status(200).json({ data });
        } catch (e) { next(e); }
    }

    static async addShipment(req, res, next) {
        try {
            const order = await OrderService.getById(req.params.id);
            if (!order) throw ApiError.NotFound("Sargyt tapylmady");
            const { isError, errors } = await Validator.validate(shipmentSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await OrderService.addShipment(req.params.id, req.body);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async updateShipment(req, res, next) {
        try {
            const model = await OrderService.updateShipment(req.params.shipmentId, req.body);
            if (!model) throw ApiError.NotFound("Ugratma tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    // Admins see all; customers see only their own
    static getFilter({ shop_id, status, paranoid } = {}, user) {
        const filter = {};
        if (!user?._role) filter.user_id = user?.id;
        if (shop_id) filter.shop_id = shop_id;
        if (status !== undefined) filter.status = status;
        if (paranoid) filter.deletedAt = { [Op.ne]: null };
        return filter;
    }
}

module.exports = OrderController;
