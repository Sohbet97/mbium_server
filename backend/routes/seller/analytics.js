const router = require('express').Router();
const { Op, QueryTypes } = require('sequelize');
const db = require('../../models');

const VALID_PERIODS = ['day', 'week', 'month'];

function normalizePeriod(p) {
    return VALID_PERIODS.includes(p) ? p : 'day';
}

// GET /seller/analytics/overview
router.get('/overview', async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        let { date_from, date_to, period = 'day' } = req.query;
        period = normalizePeriod(period);

        const [summary, revenueSeries, ordersByStatus] = await Promise.all([
            db.sequelize.query(
                `SELECT
                    SUM(CASE WHEN status = 5 THEN total_price ELSE 0 END)::float AS total_revenue,
                    COUNT(*)::int AS total_orders,
                    AVG(CASE WHEN status = 5 THEN total_price END)::float AS avg_order
                 FROM orders
                 WHERE shop_id = :shopId AND "deletedAt" IS NULL
                   ${date_from ? 'AND "createdAt" >= :date_from' : ''}
                   ${date_to   ? 'AND "createdAt" <= :date_to'   : ''}`,
                {
                    replacements: { shopId, date_from: date_from || null, date_to: date_to || null },
                    type: QueryTypes.SELECT,
                }
            ),
            db.sequelize.query(
                `SELECT DATE_TRUNC(:period, "createdAt") AS period,
                        SUM(CASE WHEN status = 5 THEN total_price ELSE 0 END)::float AS revenue,
                        COUNT(*)::int AS orders
                 FROM orders
                 WHERE shop_id = :shopId AND "deletedAt" IS NULL
                   ${date_from ? 'AND "createdAt" >= :date_from' : ''}
                   ${date_to   ? 'AND "createdAt" <= :date_to'   : ''}
                 GROUP BY 1
                 ORDER BY 1 ASC`,
                {
                    replacements: { shopId, period, date_from: date_from || null, date_to: date_to || null },
                    type: QueryTypes.SELECT,
                }
            ),
            db.sequelize.query(
                `SELECT status::int, COUNT(*)::int AS count
                 FROM orders
                 WHERE shop_id = :shopId AND "deletedAt" IS NULL
                   ${date_from ? 'AND "createdAt" >= :date_from' : ''}
                   ${date_to   ? 'AND "createdAt" <= :date_to'   : ''}
                 GROUP BY status
                 ORDER BY status ASC`,
                {
                    replacements: { shopId, date_from: date_from || null, date_to: date_to || null },
                    type: QueryTypes.SELECT,
                }
            ),
        ]);

        return res.status(200).json({
            summary: summary[0] ?? { total_revenue: 0, total_orders: 0, avg_order: 0 },
            revenue_series: revenueSeries,
            orders_by_status: ordersByStatus,
        });
    } catch (e) { next(e); }
});

// GET /seller/analytics/products
router.get('/products', async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        let { date_from, date_to, limit = 10 } = req.query;

        const data = await db.sequelize.query(
            `SELECT p.id, p.name,
                    COUNT(oi.id)::int AS orders,
                    SUM(oi.price * oi.quantity)::float AS revenue,
                    SUM(oi.quantity)::int AS units_sold
             FROM products p
             LEFT JOIN order_items oi ON oi.product_id = p.id
             LEFT JOIN orders o ON o.id = oi.order_id
               AND o."deletedAt" IS NULL
               ${date_from ? 'AND o."createdAt" >= :date_from' : ''}
               ${date_to   ? 'AND o."createdAt" <= :date_to'   : ''}
             WHERE p.shop_id = :shopId AND p."deletedAt" IS NULL
             GROUP BY p.id, p.name
             ORDER BY revenue DESC NULLS LAST
             LIMIT :limit`,
            {
                replacements: { shopId, date_from: date_from || null, date_to: date_to || null, limit: parseInt(limit) || 10 },
                type: QueryTypes.SELECT,
            }
        );

        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

// GET /seller/analytics/payouts
router.get('/payouts', async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        let { date_from, date_to, period = 'month' } = req.query;
        period = normalizePeriod(period);

        const [balance, series] = await Promise.all([
            db.SellerBalance.findOne({
                where: { shop_id: shopId },
                attributes: ['balance', 'currency'],
            }),
            db.sequelize.query(
                `SELECT DATE_TRUNC(:period, "createdAt") AS period,
                        SUM(amount)::float AS amount,
                        COUNT(*)::int AS count
                 FROM payouts
                 WHERE shop_id = :shopId AND "deletedAt" IS NULL
                   ${date_from ? 'AND "createdAt" >= :date_from' : ''}
                   ${date_to   ? 'AND "createdAt" <= :date_to'   : ''}
                 GROUP BY 1
                 ORDER BY 1 ASC`,
                {
                    replacements: { shopId, period, date_from: date_from || null, date_to: date_to || null },
                    type: QueryTypes.SELECT,
                }
            ),
        ]);

        const totalPaid = series.reduce((sum, r) => sum + (r.amount ?? 0), 0);

        return res.status(200).json({
            current_balance: parseFloat(balance?.balance ?? 0),
            currency: balance?.currency ?? 'TMT',
            total_paid: totalPaid,
            series,
        });
    } catch (e) { next(e); }
});

module.exports = router;
