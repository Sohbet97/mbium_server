const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const PayoutService = require("../services/payouts");
const { payoutRequestSchema, payoutStatusSchema } = require("../validators/payout.schema");

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "PROCESSED"];

class PayoutRequestController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = PayoutService.getRequestFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                PayoutService.getRequests(filter, limit, skip, paranoid),
                PayoutService.getRequestsCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await PayoutService.getRequestById(req.params.id);
            if (!model) throw ApiError.NotFound("Töleg talaby tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            await payoutRequestSchema.validate(req.body, { abortEarly: false });
            const model = await PayoutService.createRequest({
                ...req.body,
                requested_by: req.user?.id ?? null,
            });
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async updateStatus(req, res, next) {
        try {
            await payoutStatusSchema.validate(req.body, { abortEarly: false });

            const existing = await PayoutService.getRequestById(req.params.id);
            if (!existing) throw ApiError.NotFound("Töleg talaby tapylmady");

            const { status, notes } = req.body;

            if (!VALID_STATUSES.includes(status)) {
                throw ApiError.BadRequest("Status nädogry");
            }

            const updateData = { status, notes: notes ?? existing.notes };

            if (status === "PROCESSED") {
                updateData.processed_at = new Date();
                updateData.processed_by = req.user?.id ?? null;
                // Deduct from seller balance when payout is marked as processed
                await PayoutService.debitBalance(existing.shop_id, existing.amount);
            }

            const model = await PayoutService.updateRequest(req.params.id, updateData);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await PayoutService.deleteRequest(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await PayoutService.deleteRequest(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            await PayoutService.restoreRequest(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = PayoutRequestController;
