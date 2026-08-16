const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const turboAdminRouter = require("./routes/turbo.admin.routes");

const turboModuleRouter = require("express").Router();

turboModuleRouter.use(
    "/turbo",
    routeGuard({
        GET:    Permissions.TURBO_GET,
        POST:   Permissions.TURBO_POST,
        PUT:    Permissions.TURBO_PUT,
        DELETE: Permissions.TURBO_DELETE,
    }),
    turboAdminRouter
);

module.exports = turboModuleRouter;
