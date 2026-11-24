const router = require("express").Router();
const { seller: c } = require("../controllers/ads.controller");

router.get("/task-type",               c.taskTypes);
router.get("/campaign",                c.listCampaigns);
router.post("/campaign",               c.createCampaign);
router.get("/campaign/:id",            c.getCampaign);
router.get("/campaign/:id/completion", c.listCompletions);

module.exports = router;
