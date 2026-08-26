const router = require("express").Router();
const TurboController = require("../controllers/turbo.controller");

router.get("/packages",          TurboController.getAllPackages);
router.post("/packages",         TurboController.createPackage);
router.put("/packages/:id",      TurboController.updatePackage);
router.delete("/packages/:id",   TurboController.deletePackage);

router.get("/boosts",            TurboController.getAllBoosts);
router.post("/boosts/:id/cancel", TurboController.cancelBoost);

router.get("/shop-packages",          TurboController.getAllShopPackages);
router.post("/shop-packages",         TurboController.createShopPackage);
router.put("/shop-packages/:id",      TurboController.updateShopPackage);
router.delete("/shop-packages/:id",   TurboController.deleteShopPackage);

router.get("/shop-boosts",            TurboController.getAllShopBoosts);
router.post("/shop-boosts/:id/cancel", TurboController.cancelShopBoost);

module.exports = router;
