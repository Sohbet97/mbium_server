const router = require("express").Router();
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");
const colorRouter = require("./routes/color.routes");

router.use(
    "/colors",
    routeGuard({
        GET:    Permissions.COLOR_GET,
        POST:   Permissions.COLOR_POST,
        PUT:    Permissions.COLOR_PUT,
        DELETE: Permissions.COLOR_DELETE,
        PATCH:  Permissions.COLOR_PUT,
    }),
    colorRouter
);

module.exports = router;
