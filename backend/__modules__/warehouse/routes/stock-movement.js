const StockMovementController = require("../controllers/stock-movement");
const router = require("express").Router();

router.get("/", StockMovementController.get.bind(StockMovementController));

module.exports = router;
