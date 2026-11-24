const router = require("express").Router();
const CoinController = require("../controllers/coin.controller");

// Admin: balances
router.get("/balances",         CoinController.getBalances);
router.get("/balances/:userId", CoinController.getBalanceByUser);
router.delete("/balances/:userId", CoinController.deleteWallet);

// Admin: all-user transaction feed
router.get("/transactions", CoinController.getAllTransactions);
router.delete("/transactions/:id", CoinController.deleteTransaction);

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
router.delete("/topups/:id",              CoinController.deleteTopup);

module.exports = router;
