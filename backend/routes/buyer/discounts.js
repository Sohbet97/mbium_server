const router = require('express').Router();
const ApiError = require('../../exceptions/api-error');
const DiscountService = require('../../__modules__/discounts/services/discounts');

// POST /buyer/discounts/validate  – validate a coupon code
// Body: { code, shop_id? }
router.post('/validate', async (req, res, next) => {
    try {
        const { code, shop_id } = req.body;
        if (!code) throw ApiError.BadRequest('Kupon kody hökman');

        const discount = await DiscountService.getByCode(code.trim().toUpperCase());
        if (!discount) throw ApiError.NotFound('Kupon kody tapylmady ýa-da işjeň däl');

        // Optionally enforce shop scope
        if (shop_id && discount.shop_id && discount.shop_id !== shop_id) {
            throw ApiError.NotFound('Bu kupon bu dükana degişli däl');
        }

        // Check validity dates
        const now = new Date();
        if (discount.starts_at && new Date(discount.starts_at) > now) {
            throw ApiError.NotAllowed('Kupon heniz işjeň däl');
        }
        if (discount.ends_at && new Date(discount.ends_at) < now) {
            throw ApiError.NotAllowed('Kuponyň möhleti geçdi');
        }

        return res.status(200).json({ model: discount });
    } catch (e) { next(e); }
});

module.exports = router;
