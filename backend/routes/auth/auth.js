const authRouter = require('express').Router();
const authorizationMiddleware = require('../../middlewares/authorization-middleware');
const rbacMiddleware = require('../../middlewares/rbac-middleware');
const Permissions = require('../../utils/permissions');
const UserController = require('../../__modules__/user/controllers/user-controller');
const ShopController = require('../../__modules__/shops/controllers/shop');
const { avatarUpload } = require('../../utils/upload');

// ── Public ────────────────────────────────────────────────────────────────────
authRouter.get('/captcha', UserController.captcha);
authRouter.post('/register', UserController.register.bind(UserController));
authRouter.post('/login', UserController.login.bind(UserController));
authRouter.post('/google', UserController.googleLogin.bind(UserController));
authRouter.post('/verify-otp', UserController.verifyOtp.bind(UserController));
authRouter.post('/resend-otp', UserController.resendOtp.bind(UserController));
authRouter.post('/refresh', UserController.refresh.bind(UserController));

// ── Authenticated ─────────────────────────────────────────────────────────────
authRouter.post('/logout', authorizationMiddleware, UserController.logout.bind(UserController));
authRouter.post('/change-password', authorizationMiddleware, UserController.updatePassword.bind(UserController));
authRouter.post('/select-assignment', authorizationMiddleware, UserController.selectAssignment.bind(UserController));
authRouter.get('/sessions', authorizationMiddleware, UserController.getSessions.bind(UserController));
authRouter.delete('/sessions/:id', authorizationMiddleware, UserController.deleteSession.bind(UserController));

// ── Self-service profile ──────────────────────────────────────────────────────
authRouter.get('/me', authorizationMiddleware, UserController.getMe.bind(UserController));
authRouter.patch('/me', authorizationMiddleware, UserController.updateMe.bind(UserController));
authRouter.delete('/me/google', authorizationMiddleware, UserController.disconnectGoogle.bind(UserController));
authRouter.post('/me/avatar', authorizationMiddleware, avatarUpload.single('avatar'), UserController.uploadAvatar.bind(UserController));

// ── Shop application ──────────────────────────────────────────────────────────
authRouter.post('/me/shop', authorizationMiddleware, ShopController.applyForShop.bind(ShopController));
authRouter.get('/me/shop',  authorizationMiddleware, ShopController.getMyShop.bind(ShopController));

// ── FCM device token ──────────────────────────────────────────────────────────
authRouter.patch('/me/device-token', authorizationMiddleware, UserController.registerDeviceToken.bind(UserController));

// ── Admin ─────────────────────────────────────────────────────────────────────
authRouter.post(
  '/force-login',
  authorizationMiddleware,
  (req, res, next) => rbacMiddleware(req, next, Permissions.USER_LOGIN_AS),
  UserController.forceLogin.bind(UserController)
);

module.exports = authRouter;