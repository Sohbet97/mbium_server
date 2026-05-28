const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const InventoryService = require("../services/inventory");
const { upsertLevelSchema, adjustStockSchema } = require("../validators/inventory.schema");

class InventoryController {
    static async getLevels(req, res, next) {
        try {
            const filter = InventoryService.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                InventoryService.getLevels(filter, limit, skip),
                InventoryService.getLevelsCount(filter),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async upsertLevel(req, res, next) {
        try {
            await upsertLevelSchema.validate(req.body, { abortEarly: false });
            const { warehouse_id, product_id, variant_id, quantity } = req.body;
            const model = await InventoryService.upsertLevel(warehouse_id, product_id, variant_id, quantity);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async adjustStock(req, res, next) {
        try {
            await adjustStockSchema.validate(req.body, { abortEarly: false });
            const { warehouse_id, product_id, variant_id, quantity, type, note } = req.body;
            const model = await InventoryService.adjustStock(
                warehouse_id, product_id, variant_id, quantity, type, note, req.user?.id
            );
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }
}

module.exports = InventoryController;
