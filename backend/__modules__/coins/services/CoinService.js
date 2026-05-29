const { Op } = require("sequelize");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");

class CoinService {

    static async ensureWallet(userId) {
        const [wallet] = await db.UserCoinBalance.findOrCreate({
            where: { user_id: userId },
            defaults: { user_id: userId, balance: 0, total_earned: 0, total_spent: 0 },
        });
        return wallet;
    }

    static async getBalance(userId) {
        return db.UserCoinBalance.findOne({ where: { user_id: userId } });
    }

    static async getHistory(userId, limit = 20, skip = 0) {
        return db.CoinTransaction.findAndCountAll({
            where: { user_id: userId },
            order: [["createdAt", "DESC"]],
            limit,
            offset: skip,
        });
    }

    static async credit(userId, amount, source, referenceId = null, note = null, createdBy = null) {
        if (!Number.isInteger(amount) || amount < 1)
            throw ApiError.BadRequest("Coin amount must be a positive integer");

        const t = await db.sequelize.transaction();
        try {
            await this.ensureWallet(userId);

            await db.UserCoinBalance.increment(
                { balance: amount, total_earned: amount },
                { where: { user_id: userId }, transaction: t }
            );

            const wallet = await db.UserCoinBalance.findOne({
                where: { user_id: userId },
                transaction: t,
            });

            await db.CoinTransaction.create({
                user_id: userId,
                amount,
                type: createdBy ? "GRANT" : "EARN",
                source,
                reference_id: referenceId != null ? String(referenceId) : null,
                balance_after: wallet.balance,
                note: note ?? null,
                created_by: createdBy ?? null,
            }, { transaction: t });

            await t.commit();
            return wallet;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    static async debit(userId, amount, source, referenceId = null, note = null, createdBy = null) {
        if (!Number.isInteger(amount) || amount < 1)
            throw ApiError.BadRequest("Coin amount must be a positive integer");

        const t = await db.sequelize.transaction();
        try {
            const wallet = await db.UserCoinBalance.findOne({
                where: { user_id: userId },
                lock: t.LOCK.UPDATE,
                transaction: t,
            });

            if (!wallet || wallet.balance < amount)
                throw ApiError.BadRequest("Insufficient coin balance");

            await db.UserCoinBalance.increment(
                { balance: -amount, total_spent: amount },
                { where: { user_id: userId }, transaction: t }
            );

            await wallet.reload({ transaction: t });

            await db.CoinTransaction.create({
                user_id: userId,
                amount: -amount,
                type: createdBy ? "DEDUCT" : "SPEND",
                source,
                reference_id: referenceId != null ? String(referenceId) : null,
                balance_after: wallet.balance,
                note: note ?? null,
                created_by: createdBy ?? null,
            }, { transaction: t });

            await t.commit();
            return wallet;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    // Called from OrderService when order status → CLOSED
    static async awardForOrder(order) {
        try {
            const condition = await db.CoinCondition.findOne({
                where: { source_event: "ORDER_CLOSED", is_active: true },
            });
            if (!condition) return;

            if (condition.max_per_user_per_day) {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const count = await db.CoinTransaction.count({
                    where: {
                        user_id: order.user_id,
                        source: "ORDER",
                        createdAt: { [Op.gte]: todayStart },
                    },
                });
                if (count >= condition.max_per_user_per_day) return;
            }

            const coins = Math.floor(parseFloat(order.total_price) * condition.coins_amount);
            if (coins < 1) return;

            await this.credit(
                order.user_id,
                coins,
                "ORDER",
                order.id,
                `Order #${order.id} completed`
            );
        } catch (_) {
            // non-blocking — coin award failure must not break order flow
        }
    }

    // Called from ReviewService after review is created
    static async awardForReview(userId, reviewId, productId) {
        try {
            const condition = await db.CoinCondition.findOne({
                where: { source_event: "REVIEW_WRITTEN", is_active: true },
            });
            if (!condition) return;

            // Only first review per product earns coins
            const prev = await db.CoinTransaction.count({
                where: { user_id: userId, source: "REVIEW", reference_id: String(productId) },
            });
            if (prev > 0) return;

            await this.credit(
                userId,
                condition.coins_amount,
                "REVIEW",
                reviewId,
                `Review on product #${productId}`
            );
        } catch (_) {
            // non-blocking
        }
    }

    // Admin bulk grant
    static async adminGrant(userIds, amount, note, adminId) {
        for (const uid of userIds) {
            await this.credit(uid, amount, "MANUAL", null, note, adminId);
        }
    }

    // ─── CRUD helpers for admin routes ────────────────────────────────────────

    static async getBalances(filter = {}, limit, skip = 0) {
        return db.UserCoinBalance.findAndCountAll({
            where: filter,
            order: [["balance", "DESC"]],
            limit,
            offset: skip,
            include: [{
                model: db.User,
                as: "user",
                attributes: ["id", "name", "surname", "phone_number"],
            }],
        });
    }

    static async getConditions() {
        return db.CoinCondition.findAll({ order: [["id", "ASC"]] });
    }

    static async createCondition(data) {
        return db.CoinCondition.create(data);
    }

    static async updateCondition(id, data) {
        await db.CoinCondition.update(data, { where: { id } });
        return db.CoinCondition.findOne({ where: { id } });
    }

    static async deleteCondition(id) {
        return db.CoinCondition.destroy({ where: { id } });
    }

    static async getTopups(filter = {}, limit, skip = 0) {
        return db.CoinTopup.findAndCountAll({
            where: filter,
            order: [["createdAt", "DESC"]],
            limit,
            offset: skip,
            include: [
                { model: db.User, as: "requester", attributes: ["id", "name", "surname", "phone_number"] },
                { model: db.User, as: "reviewer",  attributes: ["id", "name", "surname"], required: false },
            ],
        });
    }

    static async createTopup(userId, amountTmt, receiptUrl) {
        const coinsRequested = Math.floor(parseFloat(amountTmt) * 100);
        if (coinsRequested < 1) throw ApiError.BadRequest("Amount too small");
        return db.CoinTopup.create({
            user_id: userId,
            amount_tmt: amountTmt,
            coins_requested: coinsRequested,
            receipt_url: receiptUrl ?? null,
            status: "PENDING",
        });
    }

    static async processTopup(topupId, status, note, adminId) {
        const topup = await db.CoinTopup.findOne({ where: { id: topupId } });
        if (!topup) throw ApiError.NotFound("Topup request not found");
        if (topup.status !== "PENDING") throw ApiError.BadRequest("Request already processed");

        await topup.update({
            status,
            note: note ?? null,
            reviewed_by: adminId,
            reviewed_at: new Date(),
        });

        if (status === "APPROVED") {
            await this.credit(
                topup.user_id,
                topup.coins_requested,
                "MANUAL",
                topup.id,
                `Top-up approved (${topup.amount_tmt} TMT)`,
                adminId
            );
        }
        return topup;
    }
}

module.exports = CoinService;
