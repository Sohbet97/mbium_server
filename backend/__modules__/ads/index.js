const router = require("express").Router();
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

// Admin: /admin/ad
router.use(
    "/ad",
    routeGuard({
        GET:    Permissions.AD_GET,
        POST:   Permissions.AD_POST,
        PUT:    Permissions.AD_PUT,
        PATCH:  Permissions.AD_PUT,
        DELETE: Permissions.AD_DELETE,
    }),
    require("./routes/ads.admin.routes")
);

module.exports = router;
