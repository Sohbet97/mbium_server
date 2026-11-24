const router = require("express").Router();
const { admin: c } = require("../controllers/ads.controller");

router.get("/settings", c.getSettings);
router.put("/settings", c.updateSettings);

router.get("/task-type",        c.listTaskTypes);
router.post("/task-type",       c.createTaskType);
router.put("/task-type/:id",    c.updateTaskType);
router.delete("/task-type/:id", c.deleteTaskType);

router.get("/campaign",     c.listCampaigns);
router.get("/campaign/:id", c.getCampaign);
router.put("/campaign/:id", c.reviewCampaign);

router.get("/completion",     c.listCompletions);
router.put("/completion/:id", c.moderateCompletion);

module.exports = router;
