const router = require("express").Router();
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");
const supplierRouter = require("./routes/supplier.routes");

router.use(
    "/suppliers",
    routeGuard({
        GET:    Permissions.SUPPLIER_GET,
        POST:   Permissions.SUPPLIER_POST,
        PUT:    Permissions.SUPPLIER_PUT,
        DELETE: Permissions.SUPPLIER_DELETE,
        PATCH:  Permissions.SUPPLIER_PUT,
    }),
    supplierRouter
);

module.exports = router;
