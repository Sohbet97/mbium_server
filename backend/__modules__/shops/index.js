const authorizationMiddleware = require('../../middlewares/authorization-middleware');
const routeGuard = require('../../middlewares/route-guard');
const Permissions = require('../../utils/permissions');

const shopRouter = require('./routes/shop');
const shopTypeRouter = require('./routes/shop-type');
const shopMemberRouter = require('./routes/shop-member');

const shopModuleRouter = require('express').Router();

shopModuleRouter.use(authorizationMiddleware, routeGuard({
    GET: Permissions.SHOP_GET,
    POST: Permissions.SHOP_POST,
    PUT: Permissions.SHOP_PUT,
    DELETE: Permissions.SHOP_DELETE,
}));

shopModuleRouter.use('/shops', shopRouter);
shopModuleRouter.use('/shop-types', shopTypeRouter);
shopModuleRouter.use('/shop-members', shopMemberRouter);

module.exports = shopModuleRouter;