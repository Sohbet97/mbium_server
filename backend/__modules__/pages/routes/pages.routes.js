const router = require("express").Router();
const StaticPageController = require("../controllers/StaticPageController");

// Admin: /admin/pages
router.get("/",       StaticPageController.list);
router.post("/preview", StaticPageController.preview);
router.get("/:slug",  StaticPageController.get);
router.put("/:slug",  StaticPageController.upsert);

module.exports = router;
