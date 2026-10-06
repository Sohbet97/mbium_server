const router = require("express").Router();
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");
const guideRouter = require("./routes/guide.routes");

// Admin CRUD: /admin/guide
router.use(
    "/guide",
    routeGuard({
        GET:    Permissions.GUIDE_GET,
        POST:   Permissions.GUIDE_POST,
        PUT:    Permissions.GUIDE_PUT,
        PATCH:  Permissions.GUIDE_PUT,
        DELETE: Permissions.GUIDE_DELETE,
    }),
    guideRouter
);

module.exports = router;
