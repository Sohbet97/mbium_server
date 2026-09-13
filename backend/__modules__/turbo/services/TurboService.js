const { Op } = require("sequelize");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");
const PurchaseService = require("../../wallet/services/PurchaseService");
const { TURBO_BOOST_STATUSES } = require("../models/ProductTurboBoost.model");
const { TURBO_SHOP_BOOST_STATUSES } = require("../models/TurboShopBoost.model");

class TurboService {
    static async getPackages() {
        return db.TurboPackage.findAll({
            where: { is_active: true },
            order: [["tier_hours", "DESC"]],
        });
    }

    // ─── Admin: package CRUD ──────────────────────────────────────────────────

    static async getAllPackages() {
        return db.TurboPackage.findAll({ order: [["tier_hours", "DESC"]] });
    }

    static async createPackage(data) {
        return db.TurboPackage.create({
            tier_hours: data.tier_hours,
            price_tmt: data.price_tmt,
            price_coin: data.price_coin,
            duration_days: data.duration_days ?? 7,
            is_active: data.is_active ?? true,
        });
    }

    static async updatePackage(id, data) {
        const pkg = await db.TurboPackage.findByPk(id);
        if (!pkg) throw ApiError.NotFound("Turbo package not found");
        await pkg.update({
            tier_hours: data.tier_hours ?? pkg.tier_hours,
            price_tmt: data.price_tmt ?? pkg.price_tmt,
            price_coin: data.price_coin ?? pkg.price_coin,
            duration_days: data.duration_days ?? pkg.duration_days,
            is_active: data.is_active ?? pkg.is_active,
        });
        return pkg;
    }

    static async deletePackage(id) {
        const pkg = await db.TurboPackage.findByPk(id);
        if (!pkg) throw ApiError.NotFound("Turbo package not found");
        const inUse = await db.ProductTurboBoost.count({ where: { package_id: id } });
        if (inUse > 0)
            throw ApiError.BadRequest("Package has purchase history — deactivate it instead of deleting");
        await pkg.destroy();
    }

    static async getActiveBoost(productId) {
        return db.ProductTurboBoost.findOne({
            where: { product_id: productId, status: TURBO_BOOST_STATUSES.ACTIVE },
        });
    }

    // ─── Admin: boost oversight ───────────────────────────────────────────────

    static async getAllBoosts(filter = {}, limit = 20, skip = 0) {
        const where = {};
        if (filter.status) where.status = filter.status;
        if (filter.shop_id) where.shop_id = filter.shop_id;
        if (filter.product_id) where.product_id = filter.product_id;

        return db.ProductTurboBoost.findAndCountAll({
            where,
            include: [
                { model: db.Product, as: "product", attributes: ["id", "name"] },
                { model: db.Shop, as: "shop", attributes: ["id", "name"] },
            ],
            order: [["createdAt", "DESC"]],
            limit,
            offset: skip,
        });
    }

    // Ends a boost early (moderation action) — does not refund the seller's payment.
    static async cancelBoost(id) {
        const boost = await db.ProductTurboBoost.findByPk(id);
        if (!boost) throw ApiError.NotFound("Turbo boost not found");
        if (boost.status !== TURBO_BOOST_STATUSES.ACTIVE)
            throw ApiError.BadRequest("Boost is not active");

        await boost.update({ status: TURBO_BOOST_STATUSES.EXPIRED, expires_at: new Date() });
        await db.Product.update({ turbo_active: false }, { where: { id: boost.product_id } });
        return boost;
    }

    // Purchases a Turbo boost for a product owned by the requesting user's shop, charging
    // either the seller's Coin balance or the shop's TMT wallet via the unified
    // PurchaseService (backend/__modules__/wallet) from Part 1.
    static async purchase({ userId, shopId, productId, tierHours, currency }) {
        const product = await db.Product.findOne({ where: { id: productId, shop_id: shopId } });
        if (!product) throw ApiError.NotFound("Product not found");
        if (!product.is_active || product.moderation_status !== 1)
            throw ApiError.BadRequest("Product must be approved and active to boost");

        const pkg = await db.TurboPackage.findOne({ where: { tier_hours: tierHours, is_active: true } });
        if (!pkg) throw ApiError.BadRequest("Invalid Turbo package");

        const existing = await this.getActiveBoost(productId);
        if (existing) throw ApiError.BadRequest("Product already has an active Turbo boost");

        const amount = currency === "COIN" ? pkg.price_coin : pkg.price_tmt;

        const walletTransaction = await PurchaseService.charge({
            userId,
            shopId,
            currency,
            amount,
            feature: "TURBO_BOOST",
            referenceId: productId,
            note: `Turbo ${tierHours}h boost — product #${productId}`,
        });

        const now = new Date();
        const expiresAt = new Date(now.getTime() + pkg.duration_days * 24 * 60 * 60 * 1000);
        const nextRefreshAt = new Date(now.getTime() + tierHours * 60 * 60 * 1000);

        const boost = await db.ProductTurboBoost.create({
            product_id: productId,
            shop_id: shopId,
            package_id: pkg.id,
            tier_hours: tierHours,
            started_at: now,
            expires_at: expiresAt,
            next_refresh_at: nextRefreshAt,
            status: TURBO_BOOST_STATUSES.ACTIVE,
            currency,
            paid_amount: amount,
            wallet_transaction_id: walletTransaction.id,
        });

        await product.update({ turbo_active: true, turbo_boosted_at: now });

        return boost;
    }

    // ─── Shop packages ────────────────────────────────────────────────────────

    static async getShopPackages() {
        return db.TurboShopPackage.findAll({
            where: { is_active: true },
            order: [["tier_hours", "DESC"]],
        });
    }

    // ─── Admin: shop package CRUD ─────────────────────────────────────────────

    static async getAllShopPackages() {
        return db.TurboShopPackage.findAll({ order: [["tier_hours", "DESC"]] });
    }

    static async createShopPackage(data) {
        return db.TurboShopPackage.create({
            tier_hours: data.tier_hours,
            price_tmt: data.price_tmt,
            price_coin: data.price_coin,
            duration_days: data.duration_days ?? 7,
            is_active: data.is_active ?? true,
        });
    }

    static async updateShopPackage(id, data) {
        const pkg = await db.TurboShopPackage.findByPk(id);
        if (!pkg) throw ApiError.NotFound("Turbo shop package not found");
        await pkg.update({
            tier_hours: data.tier_hours ?? pkg.tier_hours,
            price_tmt: data.price_tmt ?? pkg.price_tmt,
            price_coin: data.price_coin ?? pkg.price_coin,
            duration_days: data.duration_days ?? pkg.duration_days,
            is_active: data.is_active ?? pkg.is_active,
        });
        return pkg;
    }

    static async deleteShopPackage(id) {
        const pkg = await db.TurboShopPackage.findByPk(id);
        if (!pkg) throw ApiError.NotFound("Turbo shop package not found");
        const inUse = await db.TurboShopBoost.count({ where: { package_id: id } });
        if (inUse > 0)
            throw ApiError.BadRequest("Package has purchase history — deactivate it instead of deleting");
        await pkg.destroy();
    }

    static async getActiveShopBoost(shopId) {
        return db.TurboShopBoost.findOne({
            where: { shop_id: shopId, status: TURBO_SHOP_BOOST_STATUSES.ACTIVE },
        });
    }

    // ─── Admin: shop boost oversight ──────────────────────────────────────────

    static async getAllShopBoosts(filter = {}, limit = 20, skip = 0) {
        const where = {};
        if (filter.status) where.status = filter.status;
        if (filter.shop_id) where.shop_id = filter.shop_id;

        return db.TurboShopBoost.findAndCountAll({
            where,
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"] },
            ],
            order: [["createdAt", "DESC"]],
            limit,
            offset: skip,
        });
    }

    // Ends a shop boost early (moderation action) — does not refund the seller's payment.
    static async cancelShopBoost(id) {
        const boost = await db.TurboShopBoost.findByPk(id);
        if (!boost) throw ApiError.NotFound("Turbo shop boost not found");
        if (boost.status !== TURBO_SHOP_BOOST_STATUSES.ACTIVE)
            throw ApiError.BadRequest("Boost is not active");

        await boost.update({ status: TURBO_SHOP_BOOST_STATUSES.EXPIRED, expires_at: new Date() });
        await db.Shop.update({ turbo_active: false }, { where: { id: boost.shop_id } });
        return boost;
    }

    // Purchases a Turbo boost for the requesting user's own shop, charging either the
    // seller's Coin balance or the shop's TMT wallet via the unified PurchaseService.
    static async purchaseShopBoost({ userId, shopId, tierHours, currency }) {
        const shop = await db.Shop.findOne({ where: { id: shopId, owner_id: userId } });
        if (!shop) throw ApiError.NotFound("Shop not found");
        if (!shop.is_active) throw ApiError.BadRequest("Shop must be active to boost");

        const pkg = await db.TurboShopPackage.findOne({ where: { tier_hours: tierHours, is_active: true } });
        if (!pkg) throw ApiError.BadRequest("Invalid Turbo package");

        const existing = await this.getActiveShopBoost(shopId);
        if (existing) throw ApiError.BadRequest("Shop already has an active Turbo boost");

        const amount = currency === "COIN" ? pkg.price_coin : pkg.price_tmt;

        const walletTransaction = await PurchaseService.charge({
            userId,
            shopId,
            currency,
            amount,
            feature: "TURBO_SHOP_BOOST",
            referenceId: shopId,
            note: `Turbo ${tierHours}h shop boost — shop #${shopId}`,
        });

        const now = new Date();
        const expiresAt = new Date(now.getTime() + pkg.duration_days * 24 * 60 * 60 * 1000);
        const nextRefreshAt = new Date(now.getTime() + tierHours * 60 * 60 * 1000);

        const boost = await db.TurboShopBoost.create({
            shop_id: shopId,
            package_id: pkg.id,
            tier_hours: tierHours,
            started_at: now,
            expires_at: expiresAt,
            next_refresh_at: nextRefreshAt,
            status: TURBO_SHOP_BOOST_STATUSES.ACTIVE,
            currency,
            paid_amount: amount,
            wallet_transaction_id: walletTransaction.id,
        });

        await shop.update({ turbo_active: true, turbo_boosted_at: now });

        return boost;
    }

    // Cron tick: refreshes due boosts' sort-priority timestamp, and expires boosts past
    // their 7-day window, for both product and shop boosts. Called periodically from
    // backend/config/app.js.
    static async tick() {
        const now = new Date();

        const due = await db.ProductTurboBoost.findAll({
            where: {
                status: TURBO_BOOST_STATUSES.ACTIVE,
                next_refresh_at: { [Op.lte]: now },
                expires_at: { [Op.gt]: now },
            },
        });
        for (const boost of due) {
            await db.Product.update({ turbo_boosted_at: now }, { where: { id: boost.product_id } });
            await boost.update({ next_refresh_at: new Date(now.getTime() + boost.tier_hours * 60 * 60 * 1000) });
        }

        const expired = await db.ProductTurboBoost.findAll({
            where: {
                status: TURBO_BOOST_STATUSES.ACTIVE,
                expires_at: { [Op.lte]: now },
            },
        });
        for (const boost of expired) {
            await db.Product.update({ turbo_active: false }, { where: { id: boost.product_id } });
            await boost.update({ status: TURBO_BOOST_STATUSES.EXPIRED });
        }

        const shopsDue = await db.TurboShopBoost.findAll({
            where: {
                status: TURBO_SHOP_BOOST_STATUSES.ACTIVE,
                next_refresh_at: { [Op.lte]: now },
                expires_at: { [Op.gt]: now },
            },
        });
        for (const boost of shopsDue) {
            await db.Shop.update({ turbo_boosted_at: now }, { where: { id: boost.shop_id } });
            await boost.update({ next_refresh_at: new Date(now.getTime() + boost.tier_hours * 60 * 60 * 1000) });
        }

        const shopsExpired = await db.TurboShopBoost.findAll({
            where: {
                status: TURBO_SHOP_BOOST_STATUSES.ACTIVE,
                expires_at: { [Op.lte]: now },
            },
        });
        for (const boost of shopsExpired) {
            await db.Shop.update({ turbo_active: false }, { where: { id: boost.shop_id } });
            await boost.update({ status: TURBO_SHOP_BOOST_STATUSES.EXPIRED });
        }

        return {
            refreshed: due.length + shopsDue.length,
            expired: expired.length + shopsExpired.length,
        };
    }
}

module.exports = TurboService;
