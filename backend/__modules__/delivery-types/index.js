const router = require("express").Router();
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");
const deliveryTypeRouter = require("./routes/delivery-type.routes");

router.use(
    "/delivery-types",
    routeGuard({
        GET:    Permissions.DELIVERY_TYPE_GET,
        POST:   Permissions.DELIVERY_TYPE_POST,
        PUT:    Permissions.DELIVERY_TYPE_PUT,
        DELETE: Permissions.DELIVERY_TYPE_DELETE,
        PATCH:  Permissions.DELIVERY_TYPE_PUT,
    }),
    deliveryTypeRouter
);

module.exports = router;
