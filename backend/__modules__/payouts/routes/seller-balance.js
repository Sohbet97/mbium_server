const SellerBalanceController = require("../controllers/seller-balance");
const router = require("express").Router();

router.get("/", SellerBalanceController.get.bind(SellerBalanceController));
router.get("/:shopId", SellerBalanceController.getByShop.bind(SellerBalanceController));

module.exports = router;
