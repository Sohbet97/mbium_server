const BannerController = require("../controllers/banner");
const router = require("express").Router();

router.get("/", BannerController.get.bind(BannerController));
router.get("/:id", BannerController.getById.bind(BannerController));
router.post("/", BannerController.create.bind(BannerController));
router.put("/:id", BannerController.update.bind(BannerController));
router.delete("/:id", BannerController.delete.bind(BannerController));
router.delete("/:id/force", BannerController.forceDelete.bind(BannerController));
router.post("/:id/restore", BannerController.restore.bind(BannerController));

module.exports = router;
