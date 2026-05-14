const CategoryController = require("../controllers/category");
const router = require("express").Router();

router.get("/", CategoryController.get.bind(CategoryController));
router.get("/tree", CategoryController.getTree.bind(CategoryController));
router.get("/:id", CategoryController.getById.bind(CategoryController));
router.post("/", CategoryController.create.bind(CategoryController));
router.put("/:id", CategoryController.update.bind(CategoryController));
router.patch("/:id/restore", CategoryController.restore.bind(CategoryController));
router.delete("/:id", CategoryController.delete.bind(CategoryController));
router.delete("/:id/force", CategoryController.forceDelete.bind(CategoryController));

module.exports = router;
