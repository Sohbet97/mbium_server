const router = require("express").Router();
const TurboController = require("../controllers/turbo.controller");

router.get("/packages", TurboController.getPackages);
router.post("/products/:id/purchase", TurboController.purchase);
router.get("/products/:id/status", TurboController.getStatus);

module.exports = router;
