const router = require("express").Router();
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");
const brandRouter = require("./routes/brand.routes");

router.use(
    "/brands",
    routeGuard({
        GET:    Permissions.BRAND_GET,
        POST:   Permissions.BRAND_POST,
        PUT:    Permissions.BRAND_PUT,
        DELETE: Permissions.BRAND_DELETE,
        PATCH:  Permissions.BRAND_PUT,
    }),
    brandRouter
);

module.exports = router;
