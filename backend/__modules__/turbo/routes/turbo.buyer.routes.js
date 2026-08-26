const router = require("express").Router();
const TurboController = require("../controllers/turbo.controller");

router.get("/packages", TurboController.getPackages);
router.post("/products/:id/purchase", TurboController.purchase);
router.get("/products/:id/status", TurboController.getStatus);

router.get("/shop-packages", TurboController.getShopPackages);
router.post("/shop/purchase", TurboController.purchaseShop);
router.get("/shop/status", TurboController.getShopStatus);

module.exports = router;
