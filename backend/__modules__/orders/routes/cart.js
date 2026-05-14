const CartController = require("../controllers/cart");
const router = require("express").Router();

router.get("/", CartController.get.bind(CartController));
router.post("/", CartController.upsert.bind(CartController));
router.delete("/", CartController.clear.bind(CartController));
router.delete("/:id", CartController.remove.bind(CartController));

module.exports = router;
