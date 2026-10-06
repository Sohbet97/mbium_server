const router = require("express").Router();
const ApiError = require("../../../exceptions/api-error");
const TariffRequestService = require("../services/TariffRequestService");
const { FUNCTIONS } = require("../../../utils/functions");

// GET /admin/tariff/request?status=pending
router.get("/", async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = String(req.query.status);
        if (req.query.shop_id) filter.shop_id = Number(req.query.shop_id);
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const { data, count } = await TariffRequestService.getAll(filter, limit, skip);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// PUT /admin/tariff/request/:id  { status: approved|rejected, comment? }
router.put("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) throw ApiError.BadRequest("Invalid id");
        const model = await TariffRequestService.review(id, req.body || {}, req.user?.id);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

module.exports = router;
