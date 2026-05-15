const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const discountRouter = require("./routes/discount");

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

module.exports = discountsModuleRouter;
