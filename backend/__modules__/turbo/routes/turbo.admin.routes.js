const router = require("express").Router();
const TurboController = require("../controllers/turbo.controller");

router.get("/packages",          TurboController.getAllPackages);
router.post("/packages",         TurboController.createPackage);
router.put("/packages/:id",      TurboController.updatePackage);
router.delete("/packages/:id",   TurboController.deletePackage);

router.get("/boosts",            TurboController.getAllBoosts);
router.post("/boosts/:id/cancel", TurboController.cancelBoost);

module.exports = router;
