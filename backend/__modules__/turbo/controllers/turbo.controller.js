const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");
const TurboService = require("../services/TurboService");

class TurboController {
    static async getPackages(req, res, next) {
        try {
            const packages = await TurboService.getPackages();
            res.json({ data: packages });
        } catch (e) { next(e); }
    }

    static async purchase(req, res, next) {
        try {
            const { tier_hours, currency } = req.body;
            // The JWT carries no shop info (buyer-app tokens are shop-agnostic) — resolve
            // the requester's own shop the same way seller-middleware does for seller routes.
            const shop = await db.Shop.findOne({ where: { owner_id: req.user.id, is_active: true } });
            if (!shop) throw ApiError.NotAllowed("Aktiwleşdirilen dükaňyz ýok", "SHOP_NOT_FOUND");

            const boost = await TurboService.purchase({
                userId: req.user.id,
                shopId: shop.id,
                productId: req.params.id,
                tierHours: parseInt(tier_hours),
                currency,
            });
            res.status(201).json(boost);
        } catch (e) { next(e); }
    }

    static async getStatus(req, res, next) {
        try {
            const boost = await TurboService.getActiveBoost(req.params.id);
            res.json(boost ?? null);
        } catch (e) { next(e); }
    }

    // ─── Admin: package CRUD ──────────────────────────────────────────────────

    static async getAllPackages(req, res, next) {
        try {
            const packages = await TurboService.getAllPackages();
            res.json({ data: packages });
        } catch (e) { next(e); }
    }

    static async createPackage(req, res, next) {
        try {
            const pkg = await TurboService.createPackage(req.body);
            res.status(201).json(pkg);
        } catch (e) { next(e); }
    }

    static async updatePackage(req, res, next) {
        try {
            const pkg = await TurboService.updatePackage(req.params.id, req.body);
            res.json(pkg);
        } catch (e) { next(e); }
    }

    static async deletePackage(req, res, next) {
        try {
            await TurboService.deletePackage(req.params.id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }

    // ─── Admin: boost oversight ────────────────────────────────────────────────

    static async getAllBoosts(req, res, next) {
        try {
            const { status, shop_id, product_id, page = 1, limit = 20 } = req.query;
            const take = parseInt(limit);
            const skip = (parseInt(page) - 1) * take;
            const { rows, count } = await TurboService.getAllBoosts({ status, shop_id, product_id }, take, skip);
            res.json({ data: rows, count });
        } catch (e) { next(e); }
    }

    static async cancelBoost(req, res, next) {
        try {
            const boost = await TurboService.cancelBoost(req.params.id);
            res.json(boost);
        } catch (e) { next(e); }
    }

    // ─── Shop boosts ────────────────────────────────────────────────────────

    static async getShopPackages(req, res, next) {
        try {
            const packages = await TurboService.getShopPackages();
            res.json({ data: packages });
        } catch (e) { next(e); }
    }

    static async purchaseShop(req, res, next) {
        try {
            const { tier_hours, currency } = req.body;
            const shop = await db.Shop.findOne({ where: { owner_id: req.user.id, is_active: true } });
            if (!shop) throw ApiError.NotAllowed("Aktiwleşdirilen dükaňyz ýok", "SHOP_NOT_FOUND");

            const boost = await TurboService.purchaseShopBoost({
                userId: req.user.id,
                shopId: shop.id,
                tierHours: parseInt(tier_hours),
                currency,
            });
            res.status(201).json(boost);
        } catch (e) { next(e); }
    }

    static async getShopStatus(req, res, next) {
        try {
            const shop = await db.Shop.findOne({ where: { owner_id: req.user.id, is_active: true } });
            if (!shop) throw ApiError.NotAllowed("Aktiwleşdirilen dükaňyz ýok", "SHOP_NOT_FOUND");

            const boost = await TurboService.getActiveShopBoost(shop.id);
            res.json(boost ?? null);
        } catch (e) { next(e); }
    }

    // ─── Admin: shop package CRUD ───────────────────────────────────────────────

    static async getAllShopPackages(req, res, next) {
        try {
            const packages = await TurboService.getAllShopPackages();
            res.json({ data: packages });
        } catch (e) { next(e); }
    }

    static async createShopPackage(req, res, next) {
        try {
            const pkg = await TurboService.createShopPackage(req.body);
            res.status(201).json(pkg);
        } catch (e) { next(e); }
    }

    static async updateShopPackage(req, res, next) {
        try {
            const pkg = await TurboService.updateShopPackage(req.params.id, req.body);
            res.json(pkg);
        } catch (e) { next(e); }
    }

    static async deleteShopPackage(req, res, next) {
        try {
            await TurboService.deleteShopPackage(req.params.id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }

    // ─── Admin: shop boost oversight ────────────────────────────────────────────

    static async getAllShopBoosts(req, res, next) {
        try {
            const { status, shop_id, page = 1, limit = 20 } = req.query;
            const take = parseInt(limit);
            const skip = (parseInt(page) - 1) * take;
            const { rows, count } = await TurboService.getAllShopBoosts({ status, shop_id }, take, skip);
            res.json({ data: rows, count });
        } catch (e) { next(e); }
    }

    static async cancelShopBoost(req, res, next) {
        try {
            const boost = await TurboService.cancelShopBoost(req.params.id);
            res.json(boost);
        } catch (e) { next(e); }
    }
}

module.exports = TurboController;
