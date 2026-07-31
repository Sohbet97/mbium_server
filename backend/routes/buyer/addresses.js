const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const DeliveryAddressService = require('../../__modules__/orders/services/delivery-addresses');

// GET /buyer/addresses
router.get('/', async (req, res, next) => {
    try {
        const data = await DeliveryAddressService.get({ user_id: req.user.id });
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// GET /buyer/addresses/:id
router.get('/:id', async (req, res, next) => {
    try {
        const model = await DeliveryAddressService.getById(req.params.id);
        if (!model || model.user_id !== req.user.id) throw ApiError.NotFound('Adres tapylmady');
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// POST /buyer/addresses
router.post('/', async (req, res, next) => {
    try {
        const model = await DeliveryAddressService.create({ ...req.body, user_id: req.user.id });
        return res.status(201).json({ model });
    } catch (e) { next(e); }
});

// PUT /buyer/addresses/:id
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await DeliveryAddressService.getById(req.params.id);
        if (!existing || existing.user_id !== req.user.id) throw ApiError.NotFound('Adres tapylmady');
        // Only pass through editable fields — never let the client's body overwrite
        // id/user_id (e.g. reassigning the address to another account).
        const editable = {};
        for (const key of ['label', 'region_id', 'city_id', 'district_id', 'street', 'apartment', 'postal_code', 'is_default']) {
            if (req.body[key] !== undefined) editable[key] = req.body[key];
        }
        const model = await DeliveryAddressService.update(req.params.id, { ...editable, user_id: req.user.id });
        return res.status(200).json({ model });
    } catch (e) { next(e); }
});

// DELETE /buyer/addresses/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await DeliveryAddressService.getById(req.params.id);
        if (!existing || existing.user_id !== req.user.id) throw ApiError.NotFound('Adres tapylmady');
        await DeliveryAddressService.delete(req.params.id);
        return res.sendStatus(200);
    } catch (e) { next(e); }
});

module.exports = router;
