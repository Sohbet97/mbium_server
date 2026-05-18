const router = require("express").Router();
const ShopSubscriptionController = require("../controllers/ShopSubscriptionController");

router.get("/",                                  ShopSubscriptionController.getAll.bind(ShopSubscriptionController));
router.post("/",                                 ShopSubscriptionController.assign.bind(ShopSubscriptionController));
router.patch("/:id/status",                      ShopSubscriptionController.updateStatus.bind(ShopSubscriptionController));
router.delete("/:id",                            ShopSubscriptionController.remove.bind(ShopSubscriptionController));
// Convenience: get active subscription for a specific shop
router.get("/shop/:shopId/active",               ShopSubscriptionController.getActiveForShop.bind(ShopSubscriptionController));

module.exports = router;
