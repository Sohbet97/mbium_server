const router = require("express").Router();
const authorizationMiddleware = require("../../../middlewares/authorization-middleware");
const { buyer: c } = require("../controllers/ads.controller");

router.get("/campaign",     c.listCampaigns);
router.get("/campaign/:id", c.getCampaign);
// List and detail work signed out too (no my_status then); history needs a user
router.get("/history",      authorizationMiddleware, c.history);

module.exports = router;
