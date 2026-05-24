const router = require("express").Router();

router.use("/audit-logs", require("./routes/audit"));

module.exports = router;
