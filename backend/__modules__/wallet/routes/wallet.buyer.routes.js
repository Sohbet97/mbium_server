const router = require("express").Router();
const WalletController = require("../controllers/wallet.controller");

router.get("/transactions", WalletController.getMyTransactions);

module.exports = router;
