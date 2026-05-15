const ReviewController = require("../controllers/review");
const router = require("express").Router();

router.get("/", ReviewController.get.bind(ReviewController));
router.get("/:id", ReviewController.getById.bind(ReviewController));
router.post("/", ReviewController.create.bind(ReviewController));
router.patch("/:id/status", ReviewController.updateStatus.bind(ReviewController));
router.get("/:id/reply", ReviewController.getReply.bind(ReviewController));
router.post("/:id/reply", ReviewController.createReply.bind(ReviewController));
router.delete("/:id/reply", ReviewController.deleteReply.bind(ReviewController));
router.delete("/:id", ReviewController.delete.bind(ReviewController));
router.delete("/:id/force", ReviewController.forceDelete.bind(ReviewController));

module.exports = router;
