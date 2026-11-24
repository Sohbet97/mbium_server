const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const disputeRouter = require("./routes/dispute");

const disputesModuleRouter = require("express").Router();

// Guard only this module's paths: a path-less use() would apply it to every admin route mounted after it
disputesModuleRouter.use(
    "/disputes",
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
