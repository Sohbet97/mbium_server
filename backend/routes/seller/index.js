const router = require('express').Router();
const authorizationMiddleware = require('../../middlewares/authorization-middleware');
const sellerMiddleware = require('../../middlewares/seller-middleware');

// All seller routes require auth + an active approved shop
router.use(authorizationMiddleware);
router.use(sellerMiddleware);

router.use('/dashboard',  require('./dashboard'));
router.use('/shop',       require('./shop'));
router.use('/categories', require('./categories'));
router.use('/products',   require('./products'));
router.use('/orders',     require('./orders'));
router.use('/payouts',    require('./payouts'));
router.use('/discounts',  require('./discounts'));
router.use('/media',      require('./media'));
router.use('/banners',    require('./banners'));
router.use('/plans',      require('./plans'));
router.use('/support',    require('./support'));

module.exports = router;
