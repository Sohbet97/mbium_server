const DeliveryAddressController = require("../controllers/delivery-address");
const router = require("express").Router();

router.get("/", DeliveryAddressController.get.bind(DeliveryAddressController));
router.get("/:id", DeliveryAddressController.getById.bind(DeliveryAddressController));
router.post("/", DeliveryAddressController.create.bind(DeliveryAddressController));
router.put("/:id", DeliveryAddressController.update.bind(DeliveryAddressController));
router.delete("/:id", DeliveryAddressController.delete.bind(DeliveryAddressController));
router.delete("/:id/force", DeliveryAddressController.forceDelete.bind(DeliveryAddressController));
router.post("/:id/restore", DeliveryAddressController.restore.bind(DeliveryAddressController));

module.exports = router;
