const ShopMemberController = require("../controllers/shop-member");
const router = require("express").Router();

router.get("/", ShopMemberController.get.bind(ShopMemberController));
router.get("/:id", ShopMemberController.getById.bind(ShopMemberController));
router.post("/", ShopMemberController.create.bind(ShopMemberController));
router.put("/:id", ShopMemberController.update.bind(ShopMemberController));
router.delete("/:id", ShopMemberController.delete.bind(ShopMemberController));
router.delete("/:id/force", ShopMemberController.forceDelete.bind(ShopMemberController));
router.post("/:id/restore", ShopMemberController.restore.bind(ShopMemberController));

module.exports = router;
