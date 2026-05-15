const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const cartRouter = require("./routes/cart");
const orderRouter = require("./routes/order");
const deliveryAddressRouter = require("./routes/delivery-address");

const ordersModuleRouter = require("express").Router();

ordersModuleRouter.use(authorizationMiddleware);

ordersModuleRouter.use("/cart", cartRouter);
ordersModuleRouter.use(
    "/delivery-addresses",
    routeGuard({
        GET: Permissions.ORDER_GET,
        POST: Permissions.ORDER_POST,
        PUT: Permissions.ORDER_PUT,
        DELETE: Permissions.ORDER_DELETE,
    }),
    deliveryAddressRouter
);
ordersModuleRouter.use(
    "/orders",
    routeGuard({
        GET: Permissions.ORDER_GET,
        POST: Permissions.ORDER_POST,
        PUT: Permissions.ORDER_PUT,
        DELETE: Permissions.ORDER_DELETE,
    }),
    orderRouter
);

module.exports = ordersModuleRouter;
