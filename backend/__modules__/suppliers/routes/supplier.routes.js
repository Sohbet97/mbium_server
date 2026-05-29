const router = require("express").Router();
const SupplierController = require("../controllers/supplier.controller");

router.get("/",      SupplierController.getAll);
router.get("/:id",   SupplierController.getById);
router.post("/",     SupplierController.create);
router.put("/:id",   SupplierController.update);
router.delete("/:id", SupplierController.delete);

module.exports = router;
