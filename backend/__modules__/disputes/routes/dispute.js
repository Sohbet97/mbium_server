const DisputeController = require("../controllers/dispute");
const router = require("express").Router();

router.get("/", DisputeController.get.bind(DisputeController));
router.get("/:id", DisputeController.getById.bind(DisputeController));
router.post("/", DisputeController.create.bind(DisputeController));
router.patch("/:id/status", DisputeController.updateStatus.bind(DisputeController));
router.delete("/:id", DisputeController.delete.bind(DisputeController));
router.delete("/:id/force", DisputeController.forceDelete.bind(DisputeController));
router.post("/:id/restore", DisputeController.restore.bind(DisputeController));

module.exports = router;
