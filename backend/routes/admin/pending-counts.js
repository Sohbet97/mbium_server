const router = require('express').Router();
const db = require('../../models');
const Permissions = require('../../utils/permissions');
const { DISPUTE_STATUSES } = require('../../__modules__/disputes/models/Dispute.model');
const { PAYOUT_REQUEST_STATUSES } = require('../../__modules__/payouts/models/PayoutRequest.model');

// GET /admin/pending-counts — per-resource pending counts for the sidebar's
// red badges, each field only computed when the caller holds its GET permission.
router.get('/', async (req, res, next) => {
    try {
        const perms = req.user?._role?.permissions || [];
        const has = (p) => perms.includes(p);
        const counts = {};
        const jobs = [];

        if (has(Permissions.PRODUCT_GET)) {
            jobs.push(db.Product.count({ where: { moderation_status: 0 } }).then((n) => { counts.products = n; }));
        }
        if (has(Permissions.REEL_GET)) {
            jobs.push(db.Reel.count({ where: { moderation_status: 0 } }).then((n) => { counts.reels = n; }));
        }
        if (has(Permissions.SHOP_GET)) {
            jobs.push(db.Shop.count({ where: { verification_status: 1 } }).then((n) => { counts.shopApplications = n; }));
            jobs.push(db.ShopTypeChangeRequest.count({ where: { status: 0 } }).then((n) => { counts.shopTypeRequests = n; }));
        }
        if (has(Permissions.KYC_GET)) {
            jobs.push(db.KycDocument.count({ where: { status: 'pending' } }).then((n) => { counts.kyc = n; }));
        }
        if (has(Permissions.DISPUTE_GET)) {
            jobs.push(db.Dispute.count({ where: { status: DISPUTE_STATUSES.OPEN } }).then((n) => { counts.disputes = n; }));
        }
        if (has(Permissions.PAYOUT_GET)) {
            jobs.push(db.PayoutRequest.count({ where: { status: PAYOUT_REQUEST_STATUSES.PENDING } }).then((n) => { counts.payoutRequests = n; }));
        }

        await Promise.all(jobs);
        return res.status(200).json({ data: counts });
    } catch (e) { next(e); }
});

module.exports = router;
