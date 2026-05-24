const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const ShopService = require('../../__modules__/shops/services/shops');
const ShopTypeService = require('../../__modules__/shops/services/shop-types');
const ShopTypeChangeRequestService = require('../../__modules__/shops/services/shop-type-change-requests');
const { shopLogoUpload, kycUpload } = require('../../utils/upload');

// GET /seller/shop
router.get('/', async (req, res, next) => {
    try {
        const model = await ShopService.getById(req.shop.id);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// PATCH /seller/shop — update basic profile fields
router.patch('/', async (req, res, next) => {
    try {
        const blocked = ['is_active', 'is_verified', 'verification_status', 'seller_tier', 'verified_by', 'plan_id', 'owner_id'];
        blocked.forEach((k) => delete req.body[k]);
        await ShopService.update(req.shop.id, req);
        const model = await ShopService.getById(req.shop.id);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// PUT /seller/shop/categories — set shop categories (full replace)
router.put('/categories', async (req, res, next) => {
    try {
        const categoryIds = Array.isArray(req.body.category_ids)
            ? req.body.category_ids.map(Number).filter(Boolean)
            : [];
        await ShopService.setCategories(req.shop.id, categoryIds);
        const model = await ShopService.getById(req.shop.id);
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// POST /seller/shop/logo — replace shop logo image
router.post('/logo', shopLogoUpload.single('logo'), async (req, res, next) => {
    try {
        if (!req.file) throw ApiError.BadRequest('Faýl saýlanmady');
        const logo = `/static/shop-logos/${req.file.filename}`;
        await ShopService.update(req.shop.id, { body: { logo } });
        const model = await ShopService.getById(req.shop.id);
        return res.status(200).json({ model, logo });
    } catch (e) { next(e); }
});

// POST /seller/shop/docs — upload KYC documents
// Accepts multipart fields: passport_file, patent_file, video_url (file)
// Plus text fields: bank_iban, card_number
router.post(
    '/docs',
    kycUpload.fields([
        { name: 'passport_file', maxCount: 1 },
        { name: 'patent_file',   maxCount: 1 },
        { name: 'video_url',     maxCount: 1 },
    ]),
    async (req, res, next) => {
        try {
            const updates = {};

            if (req.files?.passport_file?.[0])
                updates.passport_file = `/static/shop-docs/${req.files.passport_file[0].filename}`;
            if (req.files?.patent_file?.[0])
                updates.patent_file = `/static/shop-docs/${req.files.patent_file[0].filename}`;
            if (req.files?.video_url?.[0])
                updates.video_url = `/static/shop-docs/${req.files.video_url[0].filename}`;

            if (req.body?.bank_iban  !== undefined) updates.bank_iban  = req.body.bank_iban  || null;
            if (req.body?.card_number !== undefined) updates.card_number = req.body.card_number || null;

            if (Object.keys(updates).length)
                await ShopService.update(req.shop.id, { body: updates });

            const model = await ShopService.getById(req.shop.id);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }
);

// GET /seller/shop/types — active shop types for the type-change picker
router.get('/types', async (req, res, next) => {
    try {
        const types = await ShopTypeService.get({ is_active: true });
        return res.status(200).json({ data: types });
    } catch (e) { next(e); }
});

// GET /seller/shop/type-change-request — latest type change request for this shop
router.get('/type-change-request', async (req, res, next) => {
    try {
        const model = await ShopTypeChangeRequestService.getLatestForShop(req.shop.id);
        return res.status(200).json({ model: model ?? null });
    } catch (e) { next(e); }
});

// POST /seller/shop/type-change-request — submit a new request
router.post('/type-change-request', async (req, res, next) => {
    try {
        const { requested_type_id } = req.body;
        if (!requested_type_id) throw ApiError.BadRequest('requested_type_id is required');

        const existing = await ShopTypeChangeRequestService.getPendingForShop(req.shop.id);
        if (existing) throw ApiError.BadRequest('Garaşylýan ýüzlenme bar');

        const type = await ShopTypeService.getById(requested_type_id);
        if (!type || !type.is_active) throw ApiError.BadRequest('Saýlanan görnüş elýeterli däl');

        if (Number(requested_type_id) === Number(req.shop.type_id))
            throw ApiError.BadRequest('Bu eýýäm häzirki görnüşiňiz');

        const model = await ShopTypeChangeRequestService.create({
            shop_id:           req.shop.id,
            current_type_id:   req.shop.type_id,
            requested_type_id: Number(requested_type_id),
            requested_by:      req.user.id,
        });
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

module.exports = router;
