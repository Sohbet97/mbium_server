const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const disputeRouter = require("./routes/dispute");

const disputesModuleRouter = require("express").Router();

disputesModuleRouter.use(
    authorizationMiddleware,
    routeGuard({
        GET: Permissions.DISPUTE_GET,
        POST: Permissions.DISPUTE_POST,
        PUT: Permissions.DISPUTE_PUT,
        DELETE: Permissions.DISPUTE_DELETE,
    })
);

disputesModuleRouter.use("/disputes", disputeRouter);

module.exports = disputesModuleRouter;
