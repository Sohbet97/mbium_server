const router = require("express").Router();
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");
const sizeRouter = require("./routes/size.routes");

router.use(
    "/sizes",
    routeGuard({
        GET:    Permissions.SIZE_GET,
        POST:   Permissions.SIZE_POST,
        PUT:    Permissions.SIZE_PUT,
        DELETE: Permissions.SIZE_DELETE,
        PATCH:  Permissions.SIZE_PUT,
    }),
    sizeRouter
);

module.exports = router;
