const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const discountRouter = require("./routes/discount");
const flashSaleRouter = require("./routes/flash-sale");

const discountsModuleRouter = require("express").Router();

discountsModuleRouter.use(
    authorizationMiddleware,
    routeGuard({
        GET: Permissions.DISCOUNT_GET,
        POST: Permissions.DISCOUNT_POST,
        PUT: Permissions.DISCOUNT_PUT,
        DELETE: Permissions.DISCOUNT_DELETE,
    })
);

discountsModuleRouter.use("/discounts", discountRouter);
discountsModuleRouter.use("/flash-sales", flashSaleRouter);

module.exports = discountsModuleRouter;
