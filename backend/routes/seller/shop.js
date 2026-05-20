const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const ShopService = require('../../__modules__/shops/services/shops');
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

module.exports = router;
