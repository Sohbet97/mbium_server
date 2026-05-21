const router = require('express').Router();
const UserService = require('../../__modules__/user/services/users');

// Optional auth: attach req.user if token present, but never block
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (token) {
                const userData = await UserService.validateAccessToken(token);
                if (userData) req.user = userData;
            }
        }
    } catch (_) { /* ignore */ }
    next();
}

// Required auth middleware
const authorizationMiddleware = require('../../middlewares/authorization-middleware');

// Public browse (optional auth for personalisation)
router.use(optionalAuth);
router.use('/catalog',    require('./catalog'));
router.use('/discounts',  require('./discounts'));
router.use('/ai',         require('./ai'));

// Authenticated buyer actions
router.use('/cart',      authorizationMiddleware, require('./cart'));
router.use('/orders',    authorizationMiddleware, require('./orders'));
router.use('/addresses', authorizationMiddleware, require('./addresses'));
router.use('/reviews',   authorizationMiddleware, require('./reviews'));

module.exports = router;
