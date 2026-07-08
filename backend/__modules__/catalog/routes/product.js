const ProductController = require("../controllers/product");
const router = require("express").Router();

router.get("/", ProductController.get.bind(ProductController));
router.get("/:id", ProductController.getById.bind(ProductController));
router.post("/", ProductController.create.bind(ProductController));
router.put("/:id", ProductController.update.bind(ProductController));
router.patch("/:id/restore", ProductController.restore.bind(ProductController));
router.delete("/:id", ProductController.delete.bind(ProductController));
router.delete("/:id/force", ProductController.forceDelete.bind(ProductController));

// Variants
router.post("/:id/variants", ProductController.addVariant.bind(ProductController));
router.put("/:id/variants/:variantId", ProductController.updateVariant.bind(ProductController));
router.delete("/:id/variants/:variantId", ProductController.deleteVariant.bind(ProductController));

// Variant sizes
router.post("/:id/variants/:variantId/sizes", ProductController.addVariantSize.bind(ProductController));
router.put("/:id/variants/:variantId/sizes/:sizeRowId", ProductController.updateVariantSize.bind(ProductController));
router.delete("/:id/variants/:variantId/sizes/:sizeRowId", ProductController.deleteVariantSize.bind(ProductController));

module.exports = router;
