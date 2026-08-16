const router = require("express").Router();
const DeliveryTypeController = require("../controllers/delivery-type.controller");

router.get("/",      DeliveryTypeController.getAll);
router.get("/:id",   DeliveryTypeController.getById);
router.post("/",     DeliveryTypeController.create);
router.put("/:id",   DeliveryTypeController.update);
router.delete("/:id", DeliveryTypeController.delete);

module.exports = router;
