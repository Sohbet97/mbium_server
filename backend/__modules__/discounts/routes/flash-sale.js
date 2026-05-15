const FlashSaleController = require("../controllers/flash-sale");
const router = require("express").Router();

router.get("/", FlashSaleController.get.bind(FlashSaleController));
router.get("/:id", FlashSaleController.getById.bind(FlashSaleController));
router.post("/", FlashSaleController.create.bind(FlashSaleController));
router.put("/:id", FlashSaleController.update.bind(FlashSaleController));
router.delete("/:id", FlashSaleController.delete.bind(FlashSaleController));
router.delete("/:id/force", FlashSaleController.forceDelete.bind(FlashSaleController));
router.post("/:id/restore", FlashSaleController.restore.bind(FlashSaleController));

module.exports = router;
