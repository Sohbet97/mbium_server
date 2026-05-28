const { Op, QueryTypes } = require('sequelize');
const db = require('../../../models');

const VALID_PERIODS = ['day', 'week', 'month'];

function normalizePeriod(p) {
    return VALID_PERIODS.includes(p) ? p : 'day';
}

function dateRange(date_from, date_to) {
    const where = {};
    if (date_from || date_to) {
        where.createdAt = {};
        if (date_from) where.createdAt[Op.gte] = new Date(date_from);
        if (date_to)   where.createdAt[Op.lte] = new Date(date_to);
    }
    return where;
}

class AnalyticsService {
    static async getOverview({ date_from, date_to, period = 'day' } = {}) {
        period = normalizePeriod(period);
        const dateWhere = dateRange(date_from, date_to);

        const [totalRevenue, totalOrders, totalUsers, totalShops, revenueSeries] = await Promise.all([
            db.Order.findOne({
                where: { status: 5, ...dateWhere },
                attributes: [[db.sequelize.fn('SUM', db.sequelize.col('total_price')), 'total']],
                raw: true,
            }),
            db.Order.count({ where: dateWhere }),
            db.User.count({ where: dateWhere }),
            db.Shop.count({ where: dateWhere }),
            db.sequelize.query(
                `SELECT DATE_TRUNC(:period, "createdAt") AS period,
                        SUM(CASE WHEN status = 5 THEN total_price ELSE 0 END)::float AS revenue,
                        COUNT(*)::int AS orders
                 FROM orders
                 WHERE "deletedAt" IS NULL
                   ${date_from ? 'AND "createdAt" >= :date_from' : ''}
                   ${date_to   ? 'AND "createdAt" <= :date_to'   : ''}
                 GROUP BY 1
                 ORDER BY 1 ASC`,
                {
                    replacements: { period, date_from: date_from || null, date_to: date_to || null },
                    type: QueryTypes.SELECT,
                }
            ),
        ]);

        return {
            summary: {
                total_revenue: parseFloat(totalRevenue?.total ?? 0),
                total_orders: totalOrders,
                total_users: totalUsers,
                total_shops: totalShops,
            },
            revenue_series: revenueSeries.map((r) => ({
                period: r.period,
                revenue: r.revenue,
                orders: r.orders,
            })),
        };
    }

    static async getShops({ date_from, date_to, limit = 10 } = {}) {
        const data = await db.sequelize.query(
            `SELECT s.id, s.name,
                    SUM(CASE WHEN o.status = 5 THEN o.total_price ELSE 0 END)::float AS revenue,
                    COUNT(o.id)::int AS orders
             FROM shops s
             LEFT JOIN orders o ON o.shop_id = s.id
               AND o."deletedAt" IS NULL
               ${date_from ? 'AND o."createdAt" >= :date_from' : ''}
               ${date_to   ? 'AND o."createdAt" <= :date_to'   : ''}
             WHERE s."deletedAt" IS NULL
             GROUP BY s.id, s.name
             ORDER BY revenue DESC
             LIMIT :limit`,
            {
                replacements: { date_from: date_from || null, date_to: date_to || null, limit: parseInt(limit) || 10 },
                type: QueryTypes.SELECT,
            }
        );

        return { data };
    }

    static async getUsers({ date_from, date_to, period = 'day' } = {}) {
        period = normalizePeriod(period);

        const series = await db.sequelize.query(
            `SELECT DATE_TRUNC(:period, "createdAt") AS period,
                    COUNT(*)::int AS new_users
             FROM users
             WHERE "deletedAt" IS NULL
               ${date_from ? 'AND "createdAt" >= :date_from' : ''}
               ${date_to   ? 'AND "createdAt" <= :date_to'   : ''}
             GROUP BY 1
             ORDER BY 1 ASC`,
            {
                replacements: { period, date_from: date_from || null, date_to: date_to || null },
                type: QueryTypes.SELECT,
            }
        );

        return { series };
    }

    static async getOrders({ date_from, date_to } = {}) {
        const by_status = await db.sequelize.query(
            `SELECT status::int, COUNT(*)::int AS count
             FROM orders
             WHERE "deletedAt" IS NULL
               ${date_from ? 'AND "createdAt" >= :date_from' : ''}
               ${date_to   ? 'AND "createdAt" <= :date_to'   : ''}
             GROUP BY status
             ORDER BY status ASC`,
            {
                replacements: { date_from: date_from || null, date_to: date_to || null },
                type: QueryTypes.SELECT,
            }
        );

        return { by_status };
    }
}

module.exports = AnalyticsService;
