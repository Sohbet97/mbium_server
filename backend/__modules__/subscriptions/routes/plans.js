const router = require("express").Router();
const PlanController = require("../controllers/PlanController");

router.get("/",     PlanController.getAll.bind(PlanController));
router.get("/:id",  PlanController.getById.bind(PlanController));
router.post("/",    PlanController.create.bind(PlanController));
router.put("/:id",  PlanController.update.bind(PlanController));
router.delete("/:id", PlanController.remove.bind(PlanController));

module.exports = router;
