const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const plansRouter = require("./routes/plans");
const subscriptionsRouter = require("./routes/subscriptions");
const tariffRequestsRouter = require("./routes/tariff-requests");

const subscriptionsModuleRouter = require("express").Router();

subscriptionsModuleRouter.use(
    authorizationMiddleware,
    routeGuard({
        GET:    Permissions.PLAN_GET,
        POST:   Permissions.PLAN_POST,
        PUT:    Permissions.PLAN_PUT,
        DELETE: Permissions.PLAN_DELETE,
    })
);

subscriptionsModuleRouter.use("/plans", plansRouter);
subscriptionsModuleRouter.use("/shop-subscriptions", subscriptionsRouter);
subscriptionsModuleRouter.use("/tariff/request", tariffRequestsRouter);

module.exports = subscriptionsModuleRouter;
