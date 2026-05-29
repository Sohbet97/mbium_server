const InventoryController = require("../controllers/inventory");
const router = require("express").Router();

router.get("/", InventoryController.getLevels.bind(InventoryController));
router.put("/", InventoryController.upsertLevel.bind(InventoryController));
router.post("/adjust", InventoryController.adjustStock.bind(InventoryController));

module.exports = router;
