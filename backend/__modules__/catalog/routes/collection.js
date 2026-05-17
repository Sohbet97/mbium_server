const CollectionController = require("../controllers/collection");
const router = require("express").Router();

router.get("/search-products", CollectionController.searchProducts.bind(CollectionController));
router.get("/", CollectionController.get.bind(CollectionController));
router.get("/:id", CollectionController.getById.bind(CollectionController));
router.post("/", CollectionController.create.bind(CollectionController));
router.put("/:id", CollectionController.update.bind(CollectionController));
router.delete("/:id", CollectionController.delete.bind(CollectionController));

// Products within a collection
router.post("/:id/products", CollectionController.addProduct.bind(CollectionController));
router.delete("/:id/products/:productId", CollectionController.removeProduct.bind(CollectionController));

module.exports = router;
