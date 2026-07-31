const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const DiscountService = require('../../__modules__/discounts/services/discounts');

// POST /buyer/discounts/validate  – validate a coupon code
// Body: { code, shop_id? }
// Body: { code, shop_id?, subtotal?, quantity? } — subtotal/quantity are optional and only
// used to preview min-order/min-quantity eligibility before the buyer actually checks out.
router.post('/validate', async (req, res, next) => {
    try {
        const { code, shop_id, subtotal, quantity } = req.body;
        if (!code) throw ApiError.BadRequest('Kupon kody hökman');

        const discount = await DiscountService.getByCode(code.trim().toUpperCase());
        if (!discount) throw ApiError.NotFound('Kupon kody tapylmady ýa-da işjeň däl');

        DiscountService.assertUsable(discount, {
            shopId: shop_id,
            subtotal: subtotal != null ? parseFloat(subtotal) : null,
            quantity: quantity != null ? Number(quantity) : null,
        });

        return res.status(200).json({ model: discount });
    } catch (e) { next(e); }
});

module.exports = router;
