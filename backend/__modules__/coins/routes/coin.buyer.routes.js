const router = require("express").Router();
const CoinController = require("../controllers/coin.controller");

router.get("/balance",  CoinController.getMyBalance);
router.get("/history",  CoinController.getMyHistory);
router.post("/topup",   CoinController.submitTopup);
router.get("/topup",    CoinController.getMyTopups);

module.exports = router;
