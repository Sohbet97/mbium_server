const router = require("express").Router();
const ApiError = require("../../exceptions/api-error");
const { FUNCTIONS } = require("../../utils/functions");
const WarehouseService = require("../../__modules__/warehouse/services/warehouse");
const InventoryService = require("../../__modules__/warehouse/services/inventory");
const StockMovementService = require("../../__modules__/warehouse/services/stock-movement");
const { warehouseUpdateSchema } = require("../../__modules__/warehouse/validators/warehouse.schema");
const { upsertLevelSchema, adjustStockSchema } = require("../../__modules__/warehouse/validators/inventory.schema");

const SELLER_ADJUST_TYPES = ["INBOUND", "ADJUSTMENT", "RETURN"];

// GET /seller/warehouses
router.get("/", async (req, res, next) => {
    try {
        const filter = { shop_id: req.shop.id };
        if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === "true";
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const [data, count] = await Promise.all([
            WarehouseService.get(filter, limit, skip),
            WarehouseService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// GET /seller/warehouses/:id
router.get("/:id", async (req, res, next) => {
    try {
        const model = await WarehouseService.getById(req.params.id);
        if (!model || model.shop_id !== req.shop.id) throw ApiError.NotFound("Ammar tapylmady");
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// POST /seller/warehouses
router.post("/", async (req, res, next) => {
    try {
        const data = { ...req.body, shop_id: req.shop.id };
        const model = await WarehouseService.create(data);
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

// PUT /seller/warehouses/:id
router.put("/:id", async (req, res, next) => {
    try {
        await warehouseUpdateSchema.validate(req.body, { abortEarly: false });
        const existing = await WarehouseService.getById(req.params.id);
        if (!existing || existing.shop_id !== req.shop.id) throw ApiError.NotFound("Ammar tapylmady");
        const model = await WarehouseService.update(req.params.id, req.body);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// DELETE /seller/warehouses/:id
router.delete("/:id", async (req, res, next) => {
    try {
        const existing = await WarehouseService.getById(req.params.id);
        if (!existing || existing.shop_id !== req.shop.id) throw ApiError.NotFound("Ammar tapylmady");
        await WarehouseService.delete(req.params.id);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

// GET /seller/warehouses/:id/inventory
router.get("/:id/inventory", async (req, res, next) => {
    try {
        const warehouse = await WarehouseService.getById(req.params.id);
        if (!warehouse || warehouse.shop_id !== req.shop.id) throw ApiError.NotFound("Ammar tapylmady");
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const filter = { warehouse_id: warehouse.id };
        const [data, count] = await Promise.all([
            InventoryService.getLevels(filter, limit, skip),
            InventoryService.getLevelsCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// PUT /seller/warehouses/:id/inventory
router.put("/:id/inventory", async (req, res, next) => {
    try {
        const warehouse = await WarehouseService.getById(req.params.id);
        if (!warehouse || warehouse.shop_id !== req.shop.id) throw ApiError.NotFound("Ammar tapylmady");
        await upsertLevelSchema.validate(req.body, { abortEarly: false });
        const { product_id, variant_id, quantity } = req.body;
        const model = await InventoryService.upsertLevel(warehouse.id, product_id, variant_id, quantity);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// POST /seller/warehouses/:id/inventory/adjust
router.post("/:id/inventory/adjust", async (req, res, next) => {
    try {
        const warehouse = await WarehouseService.getById(req.params.id);
        if (!warehouse || warehouse.shop_id !== req.shop.id) throw ApiError.NotFound("Ammar tapylmady");
        await adjustStockSchema.validate(req.body, { abortEarly: false });
        const { product_id, variant_id, quantity, type, note } = req.body;
        if (!SELLER_ADJUST_TYPES.includes(type)) {
            throw ApiError.BadRequest("Rugsat edilmedik hereket görnüşi");
        }
        const model = await InventoryService.adjustStock(
            warehouse.id, product_id, variant_id, quantity, type, note, req.user?.id
        );
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// GET /seller/warehouses/:id/movements
router.get("/:id/movements", async (req, res, next) => {
    try {
        const warehouse = await WarehouseService.getById(req.params.id);
        if (!warehouse || warehouse.shop_id !== req.shop.id) throw ApiError.NotFound("Ammar tapylmady");
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const filter = { warehouse_id: warehouse.id };
        if (req.query.type) filter.type = req.query.type;
        const [data, count] = await Promise.all([
            StockMovementService.get(filter, limit, skip),
            StockMovementService.getCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

module.exports = router;
