const router = require("express").Router();
const BrandController = require("../controllers/brand.controller");

router.get("/tree",  BrandController.getTree);
router.get("/",      BrandController.getAll);
router.get("/:id",   BrandController.getById);
router.post("/",     BrandController.create);
router.put("/:id",   BrandController.update);
router.delete("/:id", BrandController.delete);

module.exports = router;
