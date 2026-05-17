const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");

const categoryRouter = require("./routes/category");
const productRouter = require("./routes/product");
const collectionRouter = require("./routes/collection");

const catalogModuleRouter = require("express").Router();

catalogModuleRouter.use(
    authorizationMiddleware,
    routeGuard({
        GET: Permissions.CATEGORY_GET,
        POST: Permissions.CATEGORY_POST,
        PUT: Permissions.CATEGORY_PUT,
        DELETE: Permissions.CATEGORY_DELETE,
    })
);

catalogModuleRouter.use("/categories", categoryRouter);
catalogModuleRouter.use(
    "/products",
    routeGuard({
        GET: Permissions.PRODUCT_GET,
        POST: Permissions.PRODUCT_POST,
        PUT: Permissions.PRODUCT_PUT,
        DELETE: Permissions.PRODUCT_DELETE,
    }),
    productRouter
);
catalogModuleRouter.use(
    "/collections",
    routeGuard({
        GET: Permissions.COLLECTION_GET,
        POST: Permissions.COLLECTION_POST,
        PUT: Permissions.COLLECTION_PUT,
        DELETE: Permissions.COLLECTION_DELETE,
    }),
    collectionRouter
);

module.exports = catalogModuleRouter;
