const OrderController = require("../controllers/order");
const router = require("express").Router();

router.get("/", OrderController.get.bind(OrderController));
router.get("/:id", OrderController.getById.bind(OrderController));
router.post("/", OrderController.create.bind(OrderController));
router.patch("/:id/status", OrderController.updateStatus.bind(OrderController));
router.post("/:id/payments", OrderController.addPayment.bind(OrderController));
router.delete("/:id", OrderController.delete.bind(OrderController));
router.delete("/:id/force", OrderController.forceDelete.bind(OrderController));

module.exports = router;
