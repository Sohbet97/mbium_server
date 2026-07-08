const ApiError = require("../../../exceptions/api-error");
const Validator = require("../../../__artefacts__/_validator_");
const CartService = require("../services/cart");
const { cartItemSchema } = require("../validators/order.schema");

class CartController {
    static async get(req, res, next) {
        try {
            const data = await CartService.getByUser(req.user?.id);
            return res.status(200).json({ data });
        } catch (e) { next(e); }
    }

    static async upsert(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(cartItemSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const { product_id, variant_id, variant_size_id, quantity } = req.body;
            const item = await CartService.upsert(req.user?.id, product_id, variant_id ?? null, variant_size_id ?? null, quantity);
            return res.status(200).json({ model: item });
        } catch (e) { next(e); }
    }

    static async remove(req, res, next) {
        try {
            await CartService.remove(req.user?.id, req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async clear(req, res, next) {
        try {
            await CartService.clear(req.user?.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = CartController;
