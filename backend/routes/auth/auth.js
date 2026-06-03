const authRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const authorizationMiddleware = require('../../middlewares/authorization-middleware');
const rbacMiddleware = require('../../middlewares/rbac-middleware');
const Permissions = require('../../utils/permissions');
const UserController = require('../../__modules__/user/controllers/user-controller');
const UserService = require('../../__modules__/user/services/users');
const db = require('../../models');
const ShopController = require('../../__modules__/shops/controllers/shop');
const ShopTypeController = require('../../__modules__/shops/controllers/shop-type');
const { avatarUpload, kycUpload } = require('../../utils/upload');

const KYC_FIELDS = kycUpload.fields([
  { name: 'passport_file', maxCount: 1 },
  { name: 'patent_file',   maxCount: 1 },
  { name: 'video_url',     maxCount: 1 },
]);

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
authRouter.get('/shop-types', authorizationMiddleware, ShopTypeController.get.bind(ShopTypeController));
authRouter.post('/me/shop', authorizationMiddleware, KYC_FIELDS, ShopController.applyForShop.bind(ShopController));
authRouter.get('/me/shop',  authorizationMiddleware, ShopController.getMyShop.bind(ShopController));

// ── FCM device token ──────────────────────────────────────────────────────────
authRouter.patch('/me/device-token',  authorizationMiddleware, UserController.registerDeviceToken.bind(UserController));
authRouter.delete('/me/device-token', authorizationMiddleware, UserController.removeDeviceToken.bind(UserController));

// ── Web deep-link token (mobile → web shop creation) ─────────────────────────
// Mobile calls this after auth to get a one-time URL for the web panel.
authRouter.post('/web-token', authorizationMiddleware, (req, res) => {
  const WEB_URL = (process.env.WEB_URL || 'http://localhost:5173').replace(/\/$/, '');
  const token = jwt.sign(
    { user_id: req.user.id, type: 'web_shop_create' },
    process.env.ACCESS_TOKEN,
    { expiresIn: '10m' }
  );
  return res.json({ url: `${WEB_URL}/apply?token=${token}` });
});

// Web panel calls this to exchange the one-time token for a real access token.
authRouter.post('/consume-web-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token hökman' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.ACCESS_TOKEN);
    } catch {
      return res.status(401).json({ message: 'Token nädogry ýa-da möhleti geçen' });
    }

    if (payload.type !== 'web_shop_create') {
      return res.status(401).json({ message: 'Nädogry token görnüşi' });
    }

    const user = await db.User.findOne({
      where: { id: payload.user_id },
      include: [{ model: db.Role, as: '_role' }],
    });
    if (!user) return res.status(404).json({ message: 'Ulanyjy tapylmady' });

    const accessToken = UserService.createAccessToken(user);
    return res.json({ token: accessToken, user });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// ── Admin ─────────────────────────────────────────────────────────────────────
authRouter.post(
  '/force-login',
  authorizationMiddleware,
  (req, res, next) => rbacMiddleware(req, next, Permissions.USER_LOGIN_AS),
  UserController.forceLogin.bind(UserController)
);

module.exports = authRouter;