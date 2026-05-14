const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const reviewRouter = require("./routes/review");

const reviewsModuleRouter = require("express").Router();

reviewsModuleRouter.use(
    authorizationMiddleware,
    routeGuard({
        GET: Permissions.REVIEW_GET,
        POST: Permissions.REVIEW_POST,
        PUT: Permissions.REVIEW_PUT,
        DELETE: Permissions.REVIEW_DELETE,
    })
);

reviewsModuleRouter.use("/reviews", reviewRouter);

module.exports = reviewsModuleRouter;
