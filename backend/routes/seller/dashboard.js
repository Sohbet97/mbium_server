const router = require('express').Router();
const db = require('../../models');
const { Op } = require('sequelize');

// GET /seller/dashboard
router.get('/', async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalProducts,
            totalOrders,
            pendingOrders,
            ordersThisMonth,
            balance,
            recentOrders,
        ] = await Promise.all([
            db.Product.count({ where: { shop_id: shopId } }),
            db.Order.count({ where: { shop_id: shopId } }),
            db.Order.count({ where: { shop_id: shopId, status: { [Op.in]: [0, 1, 2] } } }),
            db.Order.count({ where: { shop_id: shopId, createdAt: { [Op.gte]: thirtyDaysAgo } } }),
            db.SellerBalance.findOne({ where: { shop_id: shopId }, attributes: ['balance', 'currency'] }),
            db.Order.findAll({
                where: { shop_id: shopId },
                limit: 5,
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'status', 'total_price', 'currency', 'createdAt'],
                include: [{ model: db.User, as: 'customer', attributes: ['id', 'name', 'surname'] }],
            }),
        ]);

        // Revenue this month (CLOSED orders only, status=5)
        const revenueResult = await db.Order.findOne({
            where: { shop_id: shopId, status: 5, createdAt: { [Op.gte]: thirtyDaysAgo } },
            attributes: [[db.sequelize.fn('SUM', db.sequelize.col('total_price')), 'total']],
            raw: true,
        });

        return res.status(200).json({
            shop: {
                id: req.shop.id,
                name: req.shop.name,
                seller_tier: req.shop.seller_tier,
                plan: req.shop.plan || null,
            },
            stats: {
                total_products:    totalProducts,
                total_orders:      totalOrders,
                pending_orders:    pendingOrders,
                orders_this_month: ordersThisMonth,
                revenue_this_month: parseFloat(revenueResult?.total ?? 0),
                balance:           parseFloat(balance?.balance ?? 0),
                currency:          balance?.currency ?? 'TMT',
            },
            recent_orders: recentOrders,
        });
    } catch (e) { next(e); }
});

module.exports = router;
