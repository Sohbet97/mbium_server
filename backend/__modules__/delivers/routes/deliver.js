const router = require("express").Router();
const DeliverController = require("../controllers/DeliverController");

router.get("/",          DeliverController.get.bind(DeliverController));
router.get("/:id",       DeliverController.getById.bind(DeliverController));
router.post("/",         DeliverController.create.bind(DeliverController));
router.put("/:id",       DeliverController.update.bind(DeliverController));
router.delete("/:id",    DeliverController.delete.bind(DeliverController));
router.delete("/:id/force", DeliverController.forceDelete.bind(DeliverController));

module.exports = router;
