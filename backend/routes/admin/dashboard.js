const router = require('express').Router();
const { QueryTypes } = require('sequelize');
const db = require('../../models');
const Permissions = require('../../utils/permissions');

// Closed orders are the revenue basis (same as the analytics module).
const REVENUE_STATUS = 5;

const num = (v) => Number(v ?? 0);
const pct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur > 0 ? 100 : 0);

const q = (sql, replacements) => db.sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

// Current vs previous window totals for a table, over the last `days` days.
const windowed = async (table, valueExpr, extraWhere, days) => {
    const [row] = await q(
        `SELECT
            COALESCE(SUM(CASE WHEN "createdAt" >= NOW() - make_interval(days => :days) THEN ${valueExpr} END), 0)::float AS cur,
            COALESCE(SUM(CASE WHEN "createdAt" <  NOW() - make_interval(days => :days)
                               AND "createdAt" >= NOW() - make_interval(days => :days * 2) THEN ${valueExpr} END), 0)::float AS prev
         FROM ${table}
         WHERE "deletedAt" IS NULL ${extraWhere}`,
        { days },
    );
    return { current: num(row.cur), previous: num(row.prev), change_pct: pct(num(row.cur), num(row.prev)) };
};

// Daily buckets for the last `days` days with zero-filled gaps.
const dailySeries = (table, valueExpr, extraWhere, days) => q(
    `SELECT TO_CHAR(d.day, 'YYYY-MM-DD') AS day, COALESCE(x.v, 0)::float AS value
     FROM generate_series(CURRENT_DATE - (:days - 1) * INTERVAL '1 day', CURRENT_DATE, INTERVAL '1 day') AS d(day)
     LEFT JOIN (
        SELECT DATE_TRUNC('day', "createdAt") AS day, SUM(${valueExpr}) AS v
        FROM ${table}
        WHERE "deletedAt" IS NULL ${extraWhere}
        GROUP BY 1
     ) x ON x.day = d.day
     ORDER BY d.day`,
    { days },
);

// GET /admin/dashboard?days=7|30 — one payload for the dashboard, each block
// only computed when the caller holds the matching GET permission.
router.get('/', async (req, res, next) => {
    try {
        const days = Number(req.query.days) === 30 ? 30 : 7;
        const perms = req.user?._role?.permissions || [];
        const has = (p) => perms.includes(p);
        const data = { days };
        const jobs = [];

        if (has(Permissions.ORDER_GET)) {
            const rev = `CASE WHEN status = ${REVENUE_STATUS} THEN total_price ELSE 0 END`;
            jobs.push(
                Promise.all([
                    windowed('orders', '1', '', days),
                    windowed('orders', rev, '', days),
                    dailySeries('orders', '1', '', days),
                    dailySeries('orders', rev, '', days),
                    q(`SELECT status::int, COUNT(*)::int AS count FROM orders
                       WHERE "deletedAt" IS NULL AND "createdAt" >= NOW() - make_interval(days => :days)
                       GROUP BY status ORDER BY status`, { days }),
                    q(`SELECT s.id, s.name,
                              SUM(CASE WHEN o.status = ${REVENUE_STATUS} THEN o.total_price ELSE 0 END)::float AS revenue,
                              COUNT(o.id)::int AS orders
                       FROM orders o JOIN shops s ON s.id = o.shop_id
                       WHERE o."deletedAt" IS NULL AND o."createdAt" >= NOW() - make_interval(days => :days)
                       GROUP BY s.id, s.name
                       HAVING COUNT(o.id) > 0
                       ORDER BY revenue DESC, orders DESC LIMIT 5`, { days }),
                    db.Order.findAll({
                        limit: 8,
                        order: [['createdAt', 'DESC']],
                        attributes: ['id', 'status', 'total_price', 'currency', 'createdAt'],
                        include: [
                            { model: db.User, as: 'customer', attributes: ['id', 'name', 'surname'] },
                            { model: db.Shop, as: 'shop', attributes: ['id', 'name'] },
                        ],
                    }),
                    db.Order.count(),
                    q(`SELECT COALESCE(SUM(total_price), 0)::float AS total FROM orders
                       WHERE "deletedAt" IS NULL AND status = ${REVENUE_STATUS}`),
                ]).then(([orders, revenue, ordersSeries, revenueSeries, byStatus, topShops, recent, totalOrders, totalRev]) => {
                    data.orders = orders;
                    data.revenue = revenue;
                    data.orders_series = ordersSeries;
                    data.revenue_series = revenueSeries;
                    data.orders_by_status = byStatus;
                    data.top_shops = topShops;
                    data.recent_orders = recent;
                    data.totals = { ...(data.totals || {}), orders: totalOrders, revenue: num(totalRev[0]?.total) };
                }),
            );
        }

        if (has(Permissions.USER_GET)) {
            jobs.push(
                Promise.all([
                    windowed('users', '1', '', days),
                    dailySeries('users', '1', '', days),
                    db.User.count(),
                ]).then(([users, series, total]) => {
                    data.new_users = users;
                    data.users_series = series;
                    data.totals = { ...(data.totals || {}), users: total };
                }),
            );
        }

        if (has(Permissions.SHOP_GET)) {
            jobs.push(
                Promise.all([db.Shop.count(), db.Shop.count({ where: { is_active: true } })])
                    .then(([total, active]) => {
                        data.totals = { ...(data.totals || {}), shops: total, active_shops: active };
                    }),
            );
        }

        if (has(Permissions.COIN_GET)) {
            jobs.push(
                Promise.all([
                    q(`SELECT COALESCE(SUM(balance), 0)::float AS total FROM user_coin_balances`),
                    q(`SELECT source, COALESCE(SUM(-amount), 0)::float AS spent, COUNT(*)::int AS count
                       FROM coin_transactions
                       WHERE type = 'SPEND' AND "createdAt" >= NOW() - make_interval(days => :days)
                       GROUP BY source ORDER BY spent DESC`, { days }),
                ]).then(([circ, spend]) => {
                    data.coins = { in_circulation: num(circ[0]?.total), spent_by_source: spend };
                }),
            );
        }

        await Promise.all(jobs);
        return res.status(200).json({ data });
    } catch (e) { next(e); }
});

module.exports = router;
