const router = require("express").Router();
const FavoriteController = require("../controllers/favorite.controller");

router.get("/",                      FavoriteController.getFavorites);
router.post("/:productId",           FavoriteController.addFavorite);
router.delete("/:productId",         FavoriteController.removeFavorite);

module.exports = router;
