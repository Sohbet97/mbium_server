const WarehouseController = require("../controllers/warehouse");
const router = require("express").Router();

router.get("/", WarehouseController.get.bind(WarehouseController));
router.get("/:id", WarehouseController.getById.bind(WarehouseController));
router.post("/", WarehouseController.create.bind(WarehouseController));
router.put("/:id", WarehouseController.update.bind(WarehouseController));
router.delete("/:id", WarehouseController.delete.bind(WarehouseController));

module.exports = router;
