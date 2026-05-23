const router = require('express').Router();
const { Op } = require('sequelize');
const rbacMiddleware = require('../../middlewares/rbac-middleware');
const Permissions = require('../../utils/permissions');
const db = require('../../models');
const ShopService = require('../../__modules__/shops/services/shops');
const ApiError = require('../../exceptions/api-error');
const { FUNCTIONS } = require('../../utils/functions');

// GET /admin/shop-applications — list pending shop applications
router.get(
    '/',
    (req, res, next) => rbacMiddleware(req, next, Permissions.SHOP_GET),
    async (req, res, next) => {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const filter = { verification_status: 1 }; // pending

            const [data, count] = await Promise.all([
                db.Shop.findAll({
                    where: filter,
                    limit,
                    offset: skip,
                    order: [['createdAt', 'ASC']],
                    attributes: [
                        'id', 'name', 'name_ru', 'owner_id', 'seller_tier',
                        'verification_status', 'verification_note',
                        'passport_file', 'patent_file', 'video_url', 'bank_iban', 'card_number',
                        'createdAt',
                    ],
                    include: [
                        {
                            model: db.User,
                            as: 'owner',
                            attributes: ['id', 'name', 'surname', 'phone_number'],
                            required: false,
                        },
                    ],
                }),
                db.Shop.count({ where: filter }),
            ]);

            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }
);

// GET /admin/shop-applications/history — all reviewed shops (approved/rejected) with latest log
router.get(
    '/history',
    (req, res, next) => rbacMiddleware(req, next, Permissions.SHOP_GET),
    async (req, res, next) => {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                db.Shop.findAll({
                    where: { verification_status: { [Op.in]: [2, 3] } },
                    limit,
                    offset: skip,
                    order: [['verified_at', 'DESC']],
                    attributes: [
                        'id', 'name', 'owner_id', 'verification_status',
                        'verification_note', 'verified_at', 'verified_by',
                        'seller_tier', 'createdAt',
                    ],
                    include: [
                        { model: db.User, as: 'owner', attributes: ['id', 'name', 'surname', 'phone_number'], required: false },
                        { model: db.User, as: 'verifier', attributes: ['id', 'name', 'surname'], required: false },
                    ],
                }),
                db.Shop.count({ where: { verification_status: { [Op.in]: [2, 3] } } }),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }
);

// GET /admin/shop-applications/:id/history — full log for a single shop
router.get(
    '/:id/history',
    (req, res, next) => rbacMiddleware(req, next, Permissions.SHOP_GET),
    async (req, res, next) => {
        try {
            if (!db.ShopVerificationLog) return res.json({ data: [] });
            const rows = await db.ShopVerificationLog.findAll({
                where: { shop_id: req.params.id },
                include: [{ model: db.User, as: 'admin', attributes: ['id', 'name', 'surname'], required: false }],
                order: [['createdAt', 'DESC']],
            });
            return res.status(200).json({ data: rows });
        } catch (e) { next(e); }
    }
);

// POST /admin/shop-applications/:id/reopen — move rejected back to pending
router.post(
    '/:id/reopen',
    (req, res, next) => rbacMiddleware(req, next, Permissions.SHOP_PUT),
    async (req, res, next) => {
        try {
            const model = await ShopService.getById(req.params.id);
            if (!model) throw ApiError.NotFound('Dükan tapylmady');
            if (model.verification_status !== 3) throw ApiError.BadRequest('Only rejected applications can be re-opened');
            const updated = await ShopService.reopen(req.params.id, req.user?.id);
            return res.status(200).json({ model: updated });
        } catch (e) { next(e); }
    }
);

// POST /admin/shop-applications/:id/verify
router.post(
    '/:id/verify',
    (req, res, next) => rbacMiddleware(req, next, Permissions.SHOP_PUT),
    async (req, res, next) => {
        try {
            const model = await ShopService.getById(req.params.id);
            if (!model) throw ApiError.NotFound('Dükan tapylmady');
            const updated = await ShopService.verify(req.params.id, req.user?.id, req.app.io);
            return res.status(200).json({ model: updated });
        } catch (e) { next(e); }
    }
);

// POST /admin/shop-applications/:id/reject
router.post(
    '/:id/reject',
    (req, res, next) => rbacMiddleware(req, next, Permissions.SHOP_PUT),
    async (req, res, next) => {
        try {
            const model = await ShopService.getById(req.params.id);
            if (!model) throw ApiError.NotFound('Dükan tapylmady');
            const updated = await ShopService.reject(req.params.id, req.user?.id, req.body?.note, req.app.io);
            return res.status(200).json({ model: updated });
        } catch (e) { next(e); }
    }
);

module.exports = router;
