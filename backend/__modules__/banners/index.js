const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const bannerRouter = require("./routes/banner");

const bannersModuleRouter = require("express").Router();

bannersModuleRouter.use(
    authorizationMiddleware,
    routeGuard({
        GET: Permissions.BANNER_GET,
        POST: Permissions.BANNER_POST,
        PUT: Permissions.BANNER_PUT,
        DELETE: Permissions.BANNER_DELETE,
    })
);

bannersModuleRouter.use("/banners", bannerRouter);

module.exports = bannersModuleRouter;
