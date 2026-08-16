const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const PayoutService = require('../../__modules__/payouts/services/payouts');
const { PAYOUT_REQUEST_STATUSES } = require('../../__modules__/payouts/models/PayoutRequest.model');
const NotificationService = require('../../services/notifications');
const db = require('../../models');
const { FUNCTIONS } = require('../../utils/functions');

const PAYOUT_METHODS = ['CARD', 'CASH'];

// GET /seller/payouts/summary — available/pending balance + minimum payout threshold
router.get('/summary', async (req, res, next) => {
    try {
        const [balance, config, reserved] = await Promise.all([
            PayoutService.getBalanceByShop(req.shop.id),
            db.Config.findOne(),
            PayoutService.getReservedAmount(req.shop.id),
        ]);
        const availableBalance = parseFloat(balance?.available_balance ?? 0);
        return res.status(200).json({
            model: {
                shop_id: req.shop.id,
                available_balance: availableBalance,
                pending_balance: parseFloat(balance?.pending_balance ?? 0),
                reserved_amount: reserved,
                withdrawable_balance: Math.max(0, availableBalance - reserved),
                currency: balance?.currency ?? 'TMT',
                min_payout_amount: parseFloat(config?.min_payout_amount ?? 100),
            },
        });
    } catch (e) { next(e); }
});

// GET /seller/payouts/stats — today / this week / this month order-credit stats
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await PayoutService.getStats(req.shop.id);
        return res.status(200).json({ model: stats });
    } catch (e) { next(e); }
});

// GET /seller/payouts/transactions — full ledger (order credits, commission, payout debits)
router.get('/transactions', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const [data, count] = await Promise.all([
            PayoutService.getTransactions(req.shop.id, limit, skip),
            PayoutService.getTransactionsCount(req.shop.id),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// GET /seller/payouts/requests
router.get('/requests', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req);
        const filter = PayoutService.getRequestFilter({ shop_id: req.shop.id });
        const [data, count] = await Promise.all([
            PayoutService.getRequests(filter, limit, skip),
            PayoutService.getRequestsCount(filter),
        ]);
        return res.status(200).json({ data, count });
    } catch (e) { next(e); }
});

// POST /seller/payouts/requests — seller submits a withdrawal request
router.post('/requests', async (req, res, next) => {
    try {
        const [balance, config, reserved] = await Promise.all([
            PayoutService.getBalanceByShop(req.shop.id),
            db.Config.findOne(),
            PayoutService.getReservedAmount(req.shop.id),
        ]);
        const available = parseFloat(balance?.available_balance ?? 0) - reserved;
        const minPayout = parseFloat(config?.min_payout_amount ?? 100);
        const requested = parseFloat(req.body.amount ?? 0);
        const method = req.body.method;
        const cardNumber = req.body.card_number || null;

        if (requested <= 0) throw ApiError.BadRequest('Mukdar nädogry');
        if (requested < minPayout) throw ApiError.BadRequest(`Iň az pul geçirim mukdary ${minPayout} TMT`);
        if (requested > available) throw ApiError.BadRequest('Balans ýeterlik däl');
        if (!PAYOUT_METHODS.includes(method)) throw ApiError.BadRequest('Töleg usulyny saýlaň');
        if (method === 'CARD' && !cardNumber) throw ApiError.BadRequest('Karta nomerini giriziň');

        const model = await PayoutService.createRequest({
            shop_id:      req.shop.id,
            requested_by: req.user.id,
            amount:       requested,
            currency:     'TMT',
            method,
            card_number:  method === 'CARD' ? cardNumber : null,
            notes:        req.body.note || null,
            status:       PAYOUT_REQUEST_STATUSES.PENDING,
        });

        const detail = method === 'CARD' ? `Karta: ${cardNumber}` : 'Nagt';
        NotificationService.createForPayoutRequest(
            { id: model.id, shop_name: req.shop.name, amount: requested, detail },
            req.app.io
        ).catch(() => {});

        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

module.exports = router;
