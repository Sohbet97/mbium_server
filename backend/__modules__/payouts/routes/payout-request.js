const PayoutRequestController = require("../controllers/payout-request");
const router = require("express").Router();

router.get("/", PayoutRequestController.get.bind(PayoutRequestController));
router.get("/:id", PayoutRequestController.getById.bind(PayoutRequestController));
router.post("/", PayoutRequestController.create.bind(PayoutRequestController));
router.patch("/:id/status", PayoutRequestController.updateStatus.bind(PayoutRequestController));
router.delete("/:id", PayoutRequestController.delete.bind(PayoutRequestController));
router.delete("/:id/force", PayoutRequestController.forceDelete.bind(PayoutRequestController));
router.post("/:id/restore", PayoutRequestController.restore.bind(PayoutRequestController));

module.exports = router;
