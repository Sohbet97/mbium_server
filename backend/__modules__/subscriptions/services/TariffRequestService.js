const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");
const ShopSubscriptionService = require("./ShopSubscriptionService");
const { TARIFF_REQUEST_STATUSES: S } = require("../models/TariffRequest.model");

const PLAN_ATTRS = ["id", "name", "display_name_tm", "display_name_ru", "display_name_en", "price_monthly"];
const USER_ATTRS = ["id", "name", "surname"];

const include = () => [
    { model: db.Plan, as: "plan",        attributes: PLAN_ATTRS },
    { model: db.Plan, as: "currentPlan", attributes: PLAN_ATTRS },
    { model: db.Shop, as: "shop",        attributes: ["id", "name"] },
    { model: db.User, as: "reviewer",    attributes: USER_ATTRS },
];

class TariffRequestService {
    static async getAll({ shop_id, status } = {}, limit, offset = 0) {
        const where = {};
        if (shop_id !== undefined) where.shop_id = shop_id;
        if (status  !== undefined) where.status  = status;
        const [data, count] = await Promise.all([
            db.TariffRequest.findAll({ where, limit, offset, order: [["createdAt", "DESC"]], include: include() }),
            db.TariffRequest.count({ where }),
        ]);
        return { data, count };
    }

    static async getById(id) {
        return db.TariffRequest.findOne({ where: { id }, include: include() });
    }

    static async create(shop, { tariff_id, comment }, userId) {
        const plan = await db.Plan.findOne({ where: { id: tariff_id, is_active: true } });
        if (!plan) throw ApiError.NotFound("Tarif tapylmady");

        if (Number(shop.plan_id) === Number(plan.id)) {
            throw ApiError.BadRequest("Bu tarif eýýäm dükanyňyzda aktiw");
        }

        const pending = await db.TariffRequest.findOne({ where: { shop_id: shop.id, status: S.PENDING } });
        if (pending) throw ApiError.Conflict("Garaşylýan ýüzlenme eýýäm bar");

        try {
            const created = await db.TariffRequest.create({
                shop_id: shop.id,
                plan_id: plan.id,
                current_plan_id: shop.plan_id ?? null,
                comment: comment?.trim() || null,
                requested_by: userId ?? null,
                status: S.PENDING,
            });
            return this.getById(created.id);
        } catch (e) {
            // Partial unique index: a parallel request slipped past the check above
            if (e.name === "SequelizeUniqueConstraintError") {
                throw ApiError.Conflict("Garaşylýan ýüzlenme eýýäm bar");
            }
            throw e;
        }
    }

    // Admin decision. Claiming the row (pending -> final status) is a conditional update, so two
    // admins can't both process it. On approval the shop's plan is switched via the subscription
    // service, which also keeps the subscription history correct.
    static async review(id, { status, comment }, adminId) {
        if (![S.APPROVED, S.REJECTED].includes(status)) {
            throw ApiError.BadRequest("status must be 'approved' or 'rejected'");
        }

        const [claimed] = await db.TariffRequest.update(
            { status, admin_comment: comment?.trim() || null, reviewed_by: adminId ?? null, reviewed_at: new Date() },
            { where: { id, status: S.PENDING } }
        );
        if (!claimed) {
            const exists = await db.TariffRequest.findOne({ where: { id }, attributes: ["id"] });
            if (!exists) throw ApiError.NotFound("Ýüzlenme tapylmady");
            throw ApiError.Conflict("Ýüzlenme eýýäm işlenildi");
        }

        const request = await db.TariffRequest.findOne({ where: { id } });

        if (status === S.APPROVED) {
            try {
                await ShopSubscriptionService.assign({
                    shop_id: request.shop_id,
                    plan_id: request.plan_id,
                    note: `Tariff request #${request.id}`,
                    assigned_by: adminId,
                });
            } catch (e) {
                // Plan switch failed: put the request back so it can be retried
                await request.update({ status: S.PENDING, admin_comment: null, reviewed_by: null, reviewed_at: null });
                throw e;
            }
        }

        return this.getById(id);
    }
}

module.exports = TariffRequestService;
