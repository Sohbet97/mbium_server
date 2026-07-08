const router = require("express").Router();
const SizeController = require("../controllers/size.controller");

router.get("/tree",  SizeController.getTree);
router.get("/",      SizeController.getAll);
router.get("/:id",   SizeController.getById);
router.post("/",     SizeController.create);
router.put("/:id",   SizeController.update);
router.delete("/:id", SizeController.delete);

module.exports = router;
