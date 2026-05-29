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
router.use('/catalog',     require('./catalog'));
router.use('/discounts',   require('./discounts'));
router.use('/ai',          require('./ai'));
router.use('/shop-types',  require('./shop-types'));

// Authenticated buyer actions
router.use('/cart',      authorizationMiddleware, require('./cart'));
router.use('/orders',    authorizationMiddleware, require('./orders'));
router.use('/addresses', authorizationMiddleware, require('./addresses'));
router.use('/reviews',   authorizationMiddleware, require('./reviews'));
router.use('/coins',     authorizationMiddleware, require('../../__modules__/coins/routes/coin.buyer.routes'));
router.use('/favorites', authorizationMiddleware, require('../../__modules__/favorites/routes/favorite.routes'));

// Comments: read public, write requires auth
const CommentController = require('../../__modules__/comments/controllers/comment.controller')
router.get('/catalog/products/:productId/comments', CommentController.getByProduct)
router.post('/catalog/products/:productId/comments', authorizationMiddleware, CommentController.create)

module.exports = router;
