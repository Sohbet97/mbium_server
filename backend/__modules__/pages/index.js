const router = require("express").Router();
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");
const pagesRouter = require("./routes/pages.routes");

// Admin editing of static pages (privacy policy, …): /admin/pages
router.use(
    "/pages",
    routeGuard({
        GET: Permissions.PAGE_GET,
        POST: Permissions.PAGE_GET, // preview only, nothing is saved
        PUT: Permissions.PAGE_PUT,
    }),
    pagesRouter
);

module.exports = router;
