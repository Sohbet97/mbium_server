const routeGuard = require('../../middlewares/route-guard');
const Permissions = require('../../utils/permissions');

const shopRouter = require('./routes/shop');
const shopTypeRouter = require('./routes/shop-type');
const shopMemberRouter = require('./routes/shop-member');
const kycRouter = require('./routes/kyc');
const KycController = require('./controllers/kyc.controller');

const shopModuleRouter = require('express').Router();

const shopGuard = routeGuard({
    GET: Permissions.SHOP_GET,
    POST: Permissions.SHOP_POST,
    PUT: Permissions.SHOP_PUT,
    DELETE: Permissions.SHOP_DELETE,
});

const kycGuard = routeGuard({
    GET:    Permissions.KYC_GET,
    POST:   Permissions.KYC_POST,
    PATCH:  Permissions.KYC_PUT,
    DELETE: Permissions.KYC_DELETE,
});

shopModuleRouter.use('/shops', shopGuard, shopRouter);
shopModuleRouter.use('/shop-types', shopTypeRouter);
shopModuleRouter.use('/shop-members', shopGuard, shopMemberRouter);

// Per-shop KYC documents
shopModuleRouter.use('/shops/:shopId/kyc', kycGuard, kycRouter);

// Global KYC list (admin moderation queue)
shopModuleRouter.get('/kyc', kycGuard, KycController.getAll);

module.exports = shopModuleRouter;