const router = require("express").Router();
const CoinController = require("../controllers/coin.controller");

// Admin: balances
router.get("/balances",         CoinController.getBalances);
router.get("/balances/:userId", CoinController.getBalanceByUser);

// Admin: grant / deduct
router.post("/grant",  CoinController.grant);
router.post("/deduct", CoinController.deduct);

// Admin: earning conditions
router.get("/conditions",        CoinController.getConditions);
router.post("/conditions",       CoinController.createCondition);
router.put("/conditions/:id",    CoinController.updateCondition);
router.delete("/conditions/:id", CoinController.deleteCondition);

// Admin: topup requests
router.get("/topups",                    CoinController.getTopups);
router.patch("/topups/:id/status",       CoinController.processTopup);

module.exports = router;
