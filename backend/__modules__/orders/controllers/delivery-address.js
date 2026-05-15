const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const DeliveryAddressService = require("../services/delivery-addresses");
const { deliveryAddressSchema } = require("../validators/delivery-address.schema");

class DeliveryAddressController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = DeliveryAddressService.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                DeliveryAddressService.get(filter, limit, skip, paranoid),
                DeliveryAddressService.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await DeliveryAddressService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Eltip beriş salgysy tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            await deliveryAddressSchema.validate(req.body, { abortEarly: false });
            const model = await DeliveryAddressService.create(req.body);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const existing = await DeliveryAddressService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Eltip beriş salgysy tapylmady");
            const model = await DeliveryAddressService.update(req.params.id, req.body);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await DeliveryAddressService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await DeliveryAddressService.delete(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            await DeliveryAddressService.restore(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = DeliveryAddressController;
