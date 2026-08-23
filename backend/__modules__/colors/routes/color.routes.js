const router = require("express").Router();
const ColorController = require("../controllers/color.controller");

router.get("/",       ColorController.getAll);
router.get("/:id",    ColorController.getById);
router.post("/",      ColorController.create);
router.put("/:id",    ColorController.update);
router.delete("/:id", ColorController.delete);

module.exports = router;
