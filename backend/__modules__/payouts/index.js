const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const sellerBalanceRouter = require("./routes/seller-balance");
const payoutRequestRouter = require("./routes/payout-request");

const payoutsModuleRouter = require("express").Router();

// Guard only this module's paths: a path-less use() would apply it to every admin route mounted after it
payoutsModuleRouter.use(
    "/payouts",
    authorizationMiddleware,
    routeGuard({
        GET: Permissions.PAYOUT_GET,
        POST: Permissions.PAYOUT_POST,
        PUT: Permissions.PAYOUT_PUT,
        DELETE: Permissions.PAYOUT_DELETE,
    })
);

payoutsModuleRouter.use("/payouts/balances", sellerBalanceRouter);
payoutsModuleRouter.use("/payouts/requests", payoutRequestRouter);

module.exports = payoutsModuleRouter;
