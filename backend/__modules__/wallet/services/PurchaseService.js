const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");
const CoinService = require("../../coins/services/CoinService");
const PayoutService = require("../../payouts/services/payouts");

class PurchaseService {
    // Charges either the buyer's Coin balance or the shop's TMT wallet for a paid feature
    // (Turbo boost today, any future paid feature tomorrow), then records the purchase in
    // the unified wallet_transactions ledger so "my purchases" can show both currencies
    // in one feed regardless of which underlying wallet was actually debited.
    //
    // Note: CoinService.debit / PayoutService.debitForPurchase each commit their own DB
    // transaction internally (existing, unmodified code), so this isn't one atomic
    // transaction end-to-end — if the WalletTransaction insert below fails after a
    // successful debit, the wallet is correctly charged but the unified ledger row is
    // missing. That's a bookkeeping gap only; it never causes a double-charge or a free
    // purchase, since the debit itself is always the first and authoritative step.
    static async charge({ userId, shopId, currency, amount, feature, referenceId, note }) {
        if (!["TMT", "COIN"].includes(currency))
            throw ApiError.BadRequest("Invalid currency");
        if (!(Number(amount) > 0))
            throw ApiError.BadRequest("Invalid amount");

        let coinTransactionId = null;
        let sellerTransactionId = null;

        if (currency === "COIN") {
            const coinAmount = Math.round(Number(amount));
            const wallet = await CoinService.debit(userId, coinAmount, feature, referenceId, note);
            const [latest] = (await CoinService.getHistory(userId, 1, 0)).rows;
            coinTransactionId = latest?.id ?? null;
            void wallet;
        } else {
            if (!shopId) throw ApiError.BadRequest("shopId required for TMT purchases");
            const transaction = await PayoutService.debitForPurchase(shopId, amount, referenceId, note);
            sellerTransactionId = transaction.id;
        }

        return db.WalletTransaction.create({
            user_id: userId,
            shop_id: shopId ?? null,
            feature,
            reference_id: referenceId != null ? String(referenceId) : null,
            currency,
            amount,
            status: "COMPLETED",
            coin_transaction_id: coinTransactionId,
            seller_transaction_id: sellerTransactionId,
            note: note ?? null,
        });
    }

    static async getTransactions(filter = {}, limit = 20, skip = 0) {
        return db.WalletTransaction.findAndCountAll({
            where: filter,
            order: [["createdAt", "DESC"]],
            limit,
            offset: skip,
        });
    }
}

module.exports = PurchaseService;
