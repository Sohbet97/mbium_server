const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const deliverRouter = require("./routes/deliver");

const deliversModuleRouter = require("express").Router();

deliversModuleRouter.use(
    authorizationMiddleware,
    routeGuard({
        GET:    Permissions.DELIVER_GET,
        POST:   Permissions.DELIVER_POST,
        PUT:    Permissions.DELIVER_PUT,
        DELETE: Permissions.DELIVER_DELETE,
    })
);

deliversModuleRouter.use("/delivers", deliverRouter);

module.exports = deliversModuleRouter;
