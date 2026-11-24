const { Op, QueryTypes } = require("sequelize");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");
const CoinService = require("../../coins/services/CoinService");
const PurchaseService = require("../../wallet/services/PurchaseService");
const { AD_CAMPAIGN_STATUSES: CAMPAIGN } = require("../models/AdCampaign.model");
const { AD_COMPLETION_STATUSES: COMPLETION } = require("../models/AdCompletion.model");
const { AD_TASK_CODES } = require("../models/AdTaskType.model");

// Ad tasks ("Mugt mbium gazan"). A shop pays a TMT budget; it is split by the shop's plan
// (revenue_share_user) into a user pool and a platform fee. Users earn coins for doing
// tasks; each task price comes out of the pool. All money math is done in integer cents.

// The object a task type pays for is fixed by the backend action behind its code
const TARGET_BY_CODE = { review: "product", reel_like: "reel", shop_follow: "shop" };

const cents = (v) => Math.round(Number(v ?? 0) * 100);
const tmt = (c) => Math.round(c) / 100;

class AdService {
    // ——— Settings & plan access ———

    static async settings() {
        const config = await db.Config.findOne();
        return {
            min_budget: Number(config?.ad_min_budget ?? 100),
            ball_rate: Number(config?.ball_rate ?? 0.10),
        };
    }

    // Ad-only settings, kept apart from PUT /configurations (which also rewrites is_otp_enabled)
    static async updateSettings({ min_budget, ball_rate } = {}) {
        const config = (await db.Config.findOne()) ?? (await db.Config.create({}));
        if (min_budget !== undefined) {
            if (!(Number(min_budget) > 0)) throw ApiError.BadRequest("min_budget 0-dan uly bolmaly");
            config.ad_min_budget = tmt(cents(min_budget));
        }
        if (ball_rate !== undefined) {
            if (!(cents(ball_rate) >= 1)) throw ApiError.BadRequest("ball_rate iň az 0.01 bolmaly");
            config.ball_rate = tmt(cents(ball_rate));
        }
        await config.save();
        return this.settings();
    }

    // Ads need a plan with the ads dashboard and a non-zero user share
    static async planAccess(shop) {
        const plan = shop.plan_id ? await db.Plan.findByPk(shop.plan_id, { attributes: ["id", "name", "ads_dashboard", "revenue_share_user"] }) : null;
        const userPercent = Math.min(100, Math.max(0, Number(plan?.revenue_share_user ?? 0)));
        return { plan, user_percent: userPercent, allowed: Boolean(plan?.ads_dashboard) && userPercent > 0 };
    }

    // ——— Task types (admin) ———

    static listTaskTypes({ activeOnly = false } = {}) {
        return db.AdTaskType.findAll({ where: activeOnly ? { status: true } : {}, order: [["id", "ASC"]] });
    }

    static _taskTypeFields(body, { creating }) {
        const data = {};
        for (const k of ["name", "name_ru", "name_eng", "needs_moderation", "status"]) {
            if (body[k] !== undefined) data[k] = body[k];
        }
        if (body.min_price !== undefined) {
            if (!(Number(body.min_price) > 0)) throw ApiError.BadRequest("min_price 0-dan uly bolmaly");
            data.min_price = tmt(cents(body.min_price));
        }
        if (creating) {
            if (!AD_TASK_CODES.includes(body.code)) throw ApiError.BadRequest(`code: ${AD_TASK_CODES.join(" / ")}`);
            if (!body.name?.trim()) throw ApiError.BadRequest("name hökman");
            if (data.min_price === undefined) throw ApiError.BadRequest("min_price hökman");
            if (body.target_type && body.target_type !== TARGET_BY_CODE[body.code]) {
                throw ApiError.BadRequest(`${body.code} üçin target_type ${TARGET_BY_CODE[body.code]} bolmaly`);
            }
            data.code = body.code;
            data.target_type = TARGET_BY_CODE[body.code];
        }
        return data;
    }

    static createTaskType(body) {
        return db.AdTaskType.create(this._taskTypeFields(body, { creating: true }));
    }

    // code and target_type are tied to backend behaviour, so they can't change
    static async updateTaskType(id, body) {
        const type = await db.AdTaskType.findByPk(id);
        if (!type) throw ApiError.NotFound("Ýumuş görnüşi tapylmady");
        return type.update(this._taskTypeFields(body, { creating: false }));
    }

    // A type already used by a campaign is only switched off, so its history stays readable
    static async deleteTaskType(id) {
        const type = await db.AdTaskType.findByPk(id);
        if (!type) throw ApiError.NotFound("Ýumuş görnüşi tapylmady");
        const used = await db.AdCampaignTask.count({ where: { task_type_id: type.id } });
        if (used) {
            await type.update({ status: false });
            return { deleted: false, disabled: true };
        }
        await type.destroy();
        return { deleted: true, disabled: false };
    }

    // ——— Campaigns (seller) ———

    static async createCampaign(shop, body = {}) {
        const access = await this.planAccess(shop);
        if (!access.allowed) throw ApiError.NotAllowed("Tarifiňiz mahabat kampaniýasyna rugsat bermeýär", "AD_PLAN_NOT_ALLOWED");

        const { min_budget, ball_rate } = await this.settings();
        const budget = cents(body.budget);
        if (!(budget > 0) || Math.abs(Number(body.budget) * 100 - budget) > 1e-6) throw ApiError.BadRequest("budget ýalňyş");
        if (budget < cents(min_budget)) throw ApiError.BadRequest(`Býudjet iň az ${min_budget} TMT bolmaly`);

        const userPool = Math.round(budget * access.user_percent / 100);
        const tasks = await this._validateTasks(shop, body.tasks, { userPool, rate: cents(ball_rate) });

        // Charge first (it refuses on an insufficient balance), then write the campaign;
        // if writing fails, the charge is refunded so the shop never pays for nothing
        const walletTx = await PurchaseService.charge({
            userId: shop.owner_id, shopId: shop.id, currency: "TMT", amount: tmt(budget),
            feature: "AD_CAMPAIGN", referenceId: null, note: "Mahabat kampaniýasy",
        });
        try {
            const campaign = await db.sequelize.transaction(async (transaction) => {
                const c = await db.AdCampaign.create({
                    shop_id: shop.id,
                    budget: tmt(budget),
                    user_percent: access.user_percent,
                    user_pool: tmt(userPool),
                    platform_fee: tmt(budget - userPool),
                    status: CAMPAIGN.PENDING,
                    wallet_transaction_id: walletTx.id,
                }, { transaction });
                await db.AdCampaignTask.bulkCreate(tasks.map((t) => ({ ...t, campaign_id: c.id })), { transaction });
                return c;
            });
            await walletTx.update({ reference_id: String(campaign.id), note: `Mahabat kampaniýasy #${campaign.id}` });
            return this.getCampaign(campaign.id);
        } catch (e) {
            await PurchaseService.refund(walletTx.id, "Mahabat kampaniýasy döredilmedi").catch(() => {});
            throw e;
        }
    }

    static async _validateTasks(shop, input, { userPool, rate }) {
        if (!Array.isArray(input) || !input.length) throw ApiError.BadRequest("tasks hökman");

        const typeIds = [...new Set(input.map((t) => Number(t.task_type_id)))];
        if (typeIds.length !== input.length) throw ApiError.BadRequest("Bir ýumuş görnüşi kampaniýada diňe bir gezek bolup biler");
        const types = await db.AdTaskType.findAll({ where: { id: typeIds, status: true } });
        const typeById = new Map(types.map((t) => [t.id, t]));

        let limitedTotal = 0;
        const rows = [];
        for (const t of input) {
            const type = typeById.get(Number(t.task_type_id));
            if (!type) throw ApiError.BadRequest(`Ýumuş görnüşi #${t.task_type_id} tapylmady ýa-da öçürilen`);

            const price = cents(t.price);
            if (!(price > 0)) throw ApiError.BadRequest(`${type.code}: price ýalňyş`);
            if (price < cents(type.min_price)) throw ApiError.BadRequest(`${type.code}: baha iň az ${type.min_price} TMT bolmaly`);
            if (price % rate !== 0) throw ApiError.BadRequest(`${type.code}: baha ${tmt(rate).toFixed(2)} TMT-a kratny bolmaly`);
            if (price > userPool) throw ApiError.BadRequest(`${type.code}: baha ulanyjy howuzyndan uly`);

            let limit = null;
            if (t.limit !== undefined && t.limit !== null && t.limit !== "") {
                limit = Number(t.limit);
                if (!Number.isInteger(limit) || limit < 1) throw ApiError.BadRequest(`${type.code}: limit ýalňyş`);
                limitedTotal += price * limit;
            }

            let scope = null;
            let targetIds = null;
            if (type.target_type !== "shop") {
                scope = t.scope === "selected" ? "selected" : "all";
                if (scope === "selected") {
                    targetIds = [...new Set((t.target_ids ?? []).map(Number))].filter((n) => Number.isInteger(n) && n > 0);
                    if (!targetIds.length) throw ApiError.BadRequest(`${type.code}: target_ids hökman`);
                    const model = type.target_type === "product" ? db.Product : db.Reel;
                    const owned = await model.count({ where: { id: targetIds, shop_id: shop.id } });
                    if (owned !== targetIds.length) throw ApiError.BadRequest(`${type.code}: target_ids dükanyňyza degişli däl`);
                }
            }

            rows.push({ task_type_id: type.id, price: tmt(price), ball: price / rate, scope, target_ids: targetIds, limit });
        }
        if (limitedTotal > userPool) {
            throw ApiError.BadRequest(`Ýumuşlaryň jemi (${tmt(limitedTotal)} TMT) ulanyjy howuzyndan (${tmt(userPool)} TMT) uly`);
        }
        return rows;
    }

    // ——— Campaign review (admin) ———

    static async reviewCampaign(id, { status, comment } = {}) {
        if (![CAMPAIGN.ACTIVE, CAMPAIGN.REJECTED].includes(status)) throw ApiError.BadRequest("status: active / rejected");
        const campaign = await db.AdCampaign.findByPk(id);
        if (!campaign) throw ApiError.NotFound("Kampaniýa tapylmady");
        if (campaign.status !== CAMPAIGN.PENDING) throw ApiError.NotAllowed("Diňe garaşylýan kampaniýa tassyklanyp ýa-da ret edilip bilner");

        if (status === CAMPAIGN.ACTIVE) {
            await campaign.update({ status, comment: comment ?? null, approved_at: new Date() });
        } else {
            // The campaign never ran, so the whole budget goes back to the shop
            if (campaign.wallet_transaction_id) {
                await PurchaseService.refund(campaign.wallet_transaction_id, `Mahabat kampaniýasy #${campaign.id} ret edildi`);
            }
            await campaign.update({ status, comment: comment ?? null });
        }
        return this.getCampaign(campaign.id);
    }

    // ——— Reading campaigns ———

    static _include() {
        return [
            { model: db.Shop, as: "shop", attributes: ["id", "name", "logo", "owner_id"] },
            { model: db.AdCampaignTask, as: "tasks", include: [{ model: db.AdTaskType, as: "type" }] },
        ];
    }

    static _remaining(campaign) {
        return cents(campaign.user_pool) - cents(campaign.spent) - cents(campaign.reserved);
    }

    static _limitLeft(task) {
        return task.limit == null ? Infinity : task.limit - task.done_count - task.pending_count;
    }

    static _canPay(task, remaining) {
        return cents(task.price) <= remaining && this._limitLeft(task) > 0;
    }

    static _formatTask(task, remaining) {
        const price = cents(task.price);
        const byPool = Math.max(0, Math.floor(remaining / price));
        return {
            id: task.id,
            task_type_id: task.task_type_id,
            code: task.type?.code,
            name: task.type?.name, name_ru: task.type?.name_ru, name_eng: task.type?.name_eng,
            price: tmt(price),
            ball: task.ball,
            scope: task.scope,
            target_ids: task.target_ids,
            limit: task.limit,
            done_count: task.done_count,
            pending_count: task.pending_count,
            spent: tmt(price * task.done_count),
            remaining_count: Math.max(0, Math.min(this._limitLeft(task), byPool)),
        };
    }

    static _formatCampaign(c, extra = {}) {
        const remaining = this._remaining(c);
        return {
            id: c.id,
            status: c.status,
            shop: c.shop ? { id: c.shop.id, name: c.shop.name, logo: c.shop.logo } : null,
            budget: Number(c.budget),
            user_percent: c.user_percent,
            user_pool: Number(c.user_pool),
            platform_fee: Number(c.platform_fee),
            spent: Number(c.spent),
            reserved: Number(c.reserved),
            remaining: tmt(remaining),
            comment: c.comment,
            created_at: c.createdAt,
            approved_at: c.approved_at,
            finished_at: c.finished_at,
            tasks: [...(c.tasks ?? [])].sort((a, b) => a.id - b.id).map((t) => this._formatTask(t, remaining)),
            ...extra,
        };
    }

    static async getCampaign(id, { shopId } = {}) {
        const where = { id };
        if (shopId) where.shop_id = shopId; // sellers only see their own shop's campaigns
        const campaign = await db.AdCampaign.findOne({ where, include: this._include() });
        if (!campaign) throw ApiError.NotFound("Kampaniýa tapylmady");
        const users_count = await db.AdCompletion.count({
            where: { campaign_id: campaign.id, status: { [Op.ne]: COMPLETION.REJECTED } },
            distinct: true, col: "user_id",
        });
        return this._formatCampaign(campaign, { users_count });
    }

    static async listCampaigns(filter = {}, limit = 20, skip = 0) {
        const where = {};
        if (filter.status) where.status = filter.status;
        if (filter.shop_id) where.shop_id = filter.shop_id;
        const { rows, count } = await db.AdCampaign.findAndCountAll({
            where, include: this._include(), order: [["id", "DESC"]], limit, offset: skip, distinct: true,
        });
        return { data: rows.map((c) => this._formatCampaign(c)), count };
    }

    // ——— Completions ———

    static async listCompletions(filter = {}, limit = 20, skip = 0) {
        const where = {};
        if (filter.status) where.status = filter.status;
        if (filter.campaign_id) where.campaign_id = filter.campaign_id;
        if (filter.user_id) where.user_id = filter.user_id;
        const { rows, count } = await db.AdCompletion.findAndCountAll({
            where,
            include: [
                { model: db.User, as: "user", attributes: ["id", "name", "surname", "phone_number"] },
                { model: db.AdCampaignTask, as: "task", attributes: ["id", "task_type_id"], include: [{ model: db.AdTaskType, as: "type", attributes: ["id", "code", "name", "name_ru", "name_eng", "target_type"] }] },
                { model: db.AdCampaign, as: "campaign", attributes: ["id", "shop_id"], include: [{ model: db.Shop, as: "shop", attributes: ["id", "name", "logo"] }] },
                { model: db.Review, as: "review", attributes: ["id", "rating", "comment", "product_id"], required: false, paranoid: false },
            ],
            order: [["id", "DESC"]],
            limit,
            offset: skip,
        });
        return {
            data: rows.map((x) => ({
                id: x.id,
                campaign_id: x.campaign_id,
                shop: x.campaign?.shop ? { id: x.campaign.shop.id, name: x.campaign.shop.name, logo: x.campaign.shop.logo } : null,
                user: x.user,
                task: x.task?.type ? { id: x.task.id, ...x.task.type.toJSON() } : null,
                target_id: x.target_id,
                review: x.review ?? null,
                status: x.status,
                price: Number(x.price),
                ball: x.ball,
                comment: x.comment,
                created_at: x.createdAt,
                moderated_at: x.moderated_at,
            })),
            count,
        };
    }

    // Approve: reserve → spent and pay the coins. Reject: the reserve returns to the pool.
    static async moderateCompletion(id, { status, comment } = {}) {
        if (![COMPLETION.APPROVED, COMPLETION.REJECTED].includes(status)) throw ApiError.BadRequest("status: approved / rejected");

        return db.sequelize.transaction(async (transaction) => {
            const completion = await db.AdCompletion.findByPk(id, { transaction });
            if (!completion) throw ApiError.NotFound("Ýerine ýetiriş tapylmady");
            const campaign = await db.AdCampaign.findByPk(completion.campaign_id, { lock: transaction.LOCK.UPDATE, transaction });
            await completion.reload({ transaction }); // re-read under the campaign lock
            if (completion.status !== COMPLETION.PENDING) throw ApiError.NotAllowed("Bu ýerine ýetiriş eýýäm seredildi");
            const task = await db.AdCampaignTask.findByPk(completion.campaign_task_id, { transaction });

            const price = cents(completion.price);
            campaign.reserved = tmt(cents(campaign.reserved) - price);
            task.pending_count -= 1;
            if (status === COMPLETION.APPROVED) {
                campaign.spent = tmt(cents(campaign.spent) + price);
                task.done_count += 1;
                completion.coin_transaction_id = await this._payCoins(completion, transaction);
            }
            completion.status = status;
            completion.comment = comment ?? null;
            completion.moderated_at = new Date();

            await task.save({ transaction });
            await campaign.save({ transaction });
            await completion.save({ transaction });
            await this._maybeFinish(campaign, transaction);
            return completion;
        });
    }

    static async _payCoins(completion, transaction) {
        await CoinService.credit(
            completion.user_id, completion.ball, "AD", completion.id,
            `Mahabat ýumşy — kampaniýa #${completion.campaign_id}`, null, { transaction }
        );
        const tx = await db.CoinTransaction.findOne({
            where: { user_id: completion.user_id, source: "AD", reference_id: String(completion.id) },
            order: [["id", "DESC"]],
            transaction,
        });
        return tx?.id ?? null;
    }

    // Finished = no task can be paid any more and nothing is waiting for moderation
    static async _maybeFinish(campaign, transaction) {
        if (campaign.status !== CAMPAIGN.ACTIVE) return;
        const tasks = await db.AdCampaignTask.findAll({ where: { campaign_id: campaign.id }, transaction });
        const remaining = this._remaining(campaign);
        const pending = tasks.some((t) => t.pending_count > 0);
        if (!pending && !tasks.some((t) => this._canPay(t, remaining))) {
            await campaign.update({ status: CAMPAIGN.FINISHED, finished_at: new Date() }, { transaction });
        }
    }

    // ——— Rewards (called from the follow / like / review actions) ———

    // Pays the first active campaign task matching this action, or returns null.
    // Never throws: the user's action must succeed whether or not a reward applies.
    static async tryReward(userId, code, targetId, { shopId, reviewId = null } = {}) {
        try {
            if (!shopId || !targetId) return null;
            const shop = await db.Shop.findByPk(shopId, { attributes: ["id", "owner_id"] });
            if (!shop || shop.owner_id === userId) return null; // own shop never pays

            const candidates = await db.sequelize.query(
                `SELECT t.id FROM ad_campaign_tasks t
                 JOIN ad_task_types tt ON tt.id = t.task_type_id
                 JOIN ad_campaigns c ON c.id = t.campaign_id
                 WHERE c.status = 'active' AND c.shop_id = :shopId AND tt.code = :code
                   AND (t.scope IS NULL OR t.scope = 'all' OR :targetId = ANY(t.target_ids))
                 ORDER BY c.approved_at ASC, c.id ASC, t.id ASC`,
                { replacements: { shopId, code, targetId: Number(targetId) }, type: QueryTypes.SELECT }
            );
            for (const { id } of candidates) {
                const reward = await this._rewardOnTask(id, userId, Number(targetId), reviewId);
                if (reward) return reward;
            }
            return null;
        } catch (e) {
            console.error("[ads] reward failed:", e.message);
            return null;
        }
    }

    static async _rewardOnTask(taskId, userId, targetId, reviewId) {
        return db.sequelize.transaction(async (transaction) => {
            const task = await db.AdCampaignTask.findByPk(taskId, { include: [{ model: db.AdTaskType, as: "type" }], transaction });
            if (!task) return null;
            // The campaign row lock serialises every payout from this pool (and per-user duplicates)
            const campaign = await db.AdCampaign.findOne({
                where: { id: task.campaign_id, status: CAMPAIGN.ACTIVE },
                lock: transaction.LOCK.UPDATE,
                transaction,
            });
            if (!campaign) return null;
            await task.reload({ transaction });

            const already = await db.AdCompletion.count({
                where: { campaign_task_id: task.id, user_id: userId, target_id: targetId, status: { [Op.ne]: COMPLETION.REJECTED } },
                transaction,
            });
            if (already || !this._canPay(task, this._remaining(campaign))) return null;

            const price = cents(task.price);
            const moderated = Boolean(task.type?.needs_moderation);
            const completion = await db.AdCompletion.create({
                campaign_task_id: task.id,
                campaign_id: campaign.id,
                user_id: userId,
                target_id: targetId,
                review_id: reviewId,
                status: moderated ? COMPLETION.PENDING : COMPLETION.APPROVED,
                price: tmt(price),
                ball: task.ball,
                moderated_at: moderated ? null : new Date(),
            }, { transaction });

            if (moderated) {
                campaign.reserved = tmt(cents(campaign.reserved) + price);
                task.pending_count += 1;
            } else {
                campaign.spent = tmt(cents(campaign.spent) + price);
                task.done_count += 1;
                completion.coin_transaction_id = await this._payCoins(completion, transaction);
                await completion.save({ transaction });
            }
            await task.save({ transaction });
            await campaign.save({ transaction });
            await this._maybeFinish(campaign, transaction);

            return { campaign_id: campaign.id, ball: task.ball, status: completion.status };
        });
    }

    // A deleted or hidden review can't be paid: its pending completion is rejected
    static async rejectPendingForReview(reviewId) {
        const pending = await db.AdCompletion.findAll({ where: { review_id: reviewId, status: COMPLETION.PENDING }, attributes: ["id"] });
        for (const p of pending) {
            await this.moderateCompletion(p.id, { status: COMPLETION.REJECTED, comment: "Teswir aýryldy" }).catch(() => {});
        }
    }

    // ——— Buyer ———

    static async _myCompletions(userId, taskIds) {
        if (!taskIds.length) return [];
        return db.AdCompletion.findAll({
            where: { user_id: userId, campaign_task_id: taskIds, status: { [Op.ne]: COMPLETION.REJECTED } },
            attributes: ["campaign_task_id", "target_id", "status"],
        });
    }

    // Money (budget, pool) is never sent to buyers, only coins
    static _buyerCampaign(c, mine, { onlyAvailable }) {
        const remaining = this._remaining(c);
        const tasks = [...(c.tasks ?? [])]
            .sort((a, b) => a.id - b.id)
            .filter((t) => !onlyAvailable || this._canPay(t, remaining))
            .map((t) => {
                const own = mine.filter((m) => m.campaign_task_id === t.id);
                const my_status = own.some((m) => m.status === COMPLETION.APPROVED) ? COMPLETION.APPROVED
                    : own.some((m) => m.status === COMPLETION.PENDING) ? COMPLETION.PENDING : null;
                return {
                    id: t.id,
                    code: t.type?.code,
                    name: t.type?.name, name_ru: t.type?.name_ru, name_eng: t.type?.name_eng,
                    target_type: t.type?.target_type,
                    ball: t.ball,
                    scope: t.scope,
                    ...(t.scope === "selected" && { target_ids: t.target_ids }),
                    available: this._canPay(t, remaining),
                    my_status,
                    my_target_ids: own.map((m) => m.target_id),
                };
            });
        return {
            id: c.id,
            shop: c.shop ? { id: c.shop.id, name: c.shop.name, logo: c.shop.logo } : null,
            max_ball: tasks.reduce((m, t) => Math.max(m, t.ball), 0),
            tasks,
        };
    }

    static async listActiveForBuyer(userId, limit = 20, skip = 0) {
        const campaigns = await db.AdCampaign.findAll({
            where: { status: CAMPAIGN.ACTIVE }, include: this._include(), order: [["approved_at", "DESC"], ["id", "DESC"]],
        });
        const visible = campaigns.filter((c) => (c.tasks ?? []).some((t) => this._canPay(t, this._remaining(c))));
        const page = visible.slice(skip, skip + limit);
        const mine = userId ? await this._myCompletions(userId, page.flatMap((c) => c.tasks.map((t) => t.id))) : [];
        return { data: page.map((c) => this._buyerCampaign(c, mine, { onlyAvailable: true })), count: visible.length };
    }

    static async getForBuyer(userId, id) {
        const campaign = await db.AdCampaign.findOne({ where: { id, status: CAMPAIGN.ACTIVE }, include: this._include() });
        if (!campaign) throw ApiError.NotFound("Kampaniýa tapylmady");
        const mine = userId ? await this._myCompletions(userId, campaign.tasks.map((t) => t.id)) : [];
        return this._buyerCampaign(campaign, mine, { onlyAvailable: false });
    }

    static async buyerHistory(userId, limit = 20, skip = 0) {
        const { data, count } = await this.listCompletions({ user_id: userId }, limit, skip);
        // the buyer sees coins, not the TMT price behind them
        return { data: data.map(({ price, user, ...rest }) => rest), count };
    }
}

module.exports = AdService;
module.exports.TARGET_BY_CODE = TARGET_BY_CODE;
