const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const PayoutService = require('../../__modules__/payouts/services/payouts');

// POST /seller/balance/debit — called by another project (Live) to charge the shop's balance.
// The shop always comes from the token (req.shop), never from the body.
router.post('/debit', async (req, res, next) => {
    try {
        const { amount, reason, reference_id } = req.body || {};

        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0 || amt > 1e9) {
            throw ApiError.BadRequest('amount must be a positive number');
        }
        if (typeof reason !== 'string' || !reason.trim() || reason.length > 50) {
            throw ApiError.BadRequest('reason is required (max 50 characters)');
        }
        if (typeof reference_id !== 'string' || !reference_id.trim() || reference_id.length > 100) {
            throw ApiError.BadRequest('reference_id is required (max 100 characters)');
        }

        const result = await PayoutService.debitExternal(req.shop.id, {
            amount: amt,
            reason: reason.trim(),
            reference_id: reference_id.trim(),
        });
        return res.status(200).json(result);
    } catch (e) { next(e); }
});

module.exports = router;
