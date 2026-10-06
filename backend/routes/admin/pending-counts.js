const router = require('express').Router();
const db = require('../../models');
const { QueryTypes } = require('sequelize');
const Permissions = require('../../utils/permissions');
const { DISPUTE_STATUSES } = require('../../__modules__/disputes/models/Dispute.model');
const { BANNER_STATUSES } = require('../../__modules__/banners/models/Banner.model');
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
        if (has(Permissions.PLAN_GET)) {
            jobs.push(db.TariffRequest.count({ where: { status: 'pending' } }).then((n) => { counts.tariffRequests = n; }));
        }
        if (has(Permissions.CHAT_GET)) {
            // Support chats with messages this admin hasn't read (shop/product dialogs are observe-only)
            jobs.push(db.sequelize.query(
                `SELECT COUNT(*)::int AS n FROM chat_rooms r
                 WHERE r.type = 1
                   AND EXISTS (SELECT 1 FROM chat_messages m
                               WHERE m.chatroom_id = r.id AND m."createdBy" != :userId
                                 AND NOT EXISTS (SELECT 1 FROM chat_message_reads rd WHERE rd.message_id = m.id AND rd.user_id = :userId))`,
                { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
            ).then((rows) => { counts.chats = rows[0]?.n ?? 0; }));
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
        if (has(Permissions.BANNER_GET)) {
            jobs.push(db.Banner.count({ where: { status: BANNER_STATUSES.PENDING } }).then((n) => { counts.banners = n; }));
        }

        await Promise.all(jobs);
        return res.status(200).json({ data: counts });
    } catch (e) { next(e); }
});

module.exports = router;
