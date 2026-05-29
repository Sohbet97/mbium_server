const FavoriteService = require("../services/FavoriteService");
const { FUNCTIONS } = require("../../../utils/functions");

class FavoriteController {

    static async getFavorites(req, res, next) {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const result = await FavoriteService.getFavorites(req.user.id, limit, skip);
            res.json({ data: result.rows, count: result.count });
        } catch (e) { next(e); }
    }

    static async addFavorite(req, res, next) {
        try {
            const result = await FavoriteService.add(req.user.id, req.params.productId);
            res.status(result.created ? 201 : 200).json(result.favorite);
        } catch (e) { next(e); }
    }

    static async removeFavorite(req, res, next) {
        try {
            await FavoriteService.remove(req.user.id, req.params.productId);
            res.json({ success: true });
        } catch (e) { next(e); }
    }
}

module.exports = FavoriteController;
