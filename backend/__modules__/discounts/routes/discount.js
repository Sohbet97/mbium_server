const DiscountController = require("../controllers/discount");
const router = require("express").Router();

router.get("/", DiscountController.get.bind(DiscountController));
router.get("/:id", DiscountController.getById.bind(DiscountController));
router.post("/", DiscountController.create.bind(DiscountController));
router.put("/:id", DiscountController.update.bind(DiscountController));
router.delete("/:id", DiscountController.delete.bind(DiscountController));
router.delete("/:id/force", DiscountController.forceDelete.bind(DiscountController));
router.post("/:id/restore", DiscountController.restore.bind(DiscountController));

module.exports = router;
