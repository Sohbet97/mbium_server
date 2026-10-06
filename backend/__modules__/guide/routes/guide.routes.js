const router = require("express").Router();
const GuideController = require("../controllers/GuideController");

router.get("/",       GuideController.getAll);
router.get("/:id",    GuideController.getById);
router.post("/",      GuideController.create);
router.put("/:id",    GuideController.update);
router.delete("/:id", GuideController.delete);

module.exports = router;
