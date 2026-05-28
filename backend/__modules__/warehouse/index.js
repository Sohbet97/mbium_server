const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const warehouseRouter = require("./routes/warehouse");
const inventoryRouter = require("./routes/inventory");
const stockMovementRouter = require("./routes/stock-movement");

const warehouseModuleRouter = require("express").Router();

warehouseModuleRouter.use(authorizationMiddleware);

warehouseModuleRouter.use(
    "/warehouses",
    routeGuard({
        GET:    Permissions.WAREHOUSE_GET,
        POST:   Permissions.WAREHOUSE_POST,
        PUT:    Permissions.WAREHOUSE_PUT,
        DELETE: Permissions.WAREHOUSE_DELETE,
    }),
    warehouseRouter
);

warehouseModuleRouter.use(
    "/inventory",
    routeGuard({
        GET: Permissions.WAREHOUSE_GET,
        PUT: Permissions.WAREHOUSE_PUT,
        POST: Permissions.WAREHOUSE_POST,
    }),
    inventoryRouter
);

warehouseModuleRouter.use(
    "/stock-movements",
    routeGuard({
        GET: Permissions.WAREHOUSE_GET,
    }),
    stockMovementRouter
);

module.exports = warehouseModuleRouter;
