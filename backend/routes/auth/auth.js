const authRouter = require('express').Router();
const authorizationMiddleware = require('../../middlewares/authorization-middleware');
const rbacMiddleware = require('../../middlewares/rbac-middleware');
const Permissions = require('../../utils/permissions');
const UserController = require('../../__modules__/user/controllers/user-controller');

// ── Public ────────────────────────────────────────────────────────────────────
authRouter.get('/captcha', UserController.captcha);
authRouter.post('/register', UserController.register.bind(UserController));
authRouter.post('/login', UserController.login.bind(UserController));
authRouter.post('/verify-otp', UserController.verifyOtp.bind(UserController));
authRouter.post('/resend-otp', UserController.resendOtp.bind(UserController));
authRouter.post('/refresh', UserController.refresh.bind(UserController));

// ── Authenticated ─────────────────────────────────────────────────────────────
authRouter.post('/logout', authorizationMiddleware, UserController.logout.bind(UserController));
authRouter.post('/change-password', authorizationMiddleware, UserController.updatePassword.bind(UserController));
authRouter.post('/select-assignment', authorizationMiddleware, UserController.selectAssignment.bind(UserController));
authRouter.get('/sessions', authorizationMiddleware, UserController.getSessions.bind(UserController));
authRouter.delete('/sessions/:id', authorizationMiddleware, UserController.deleteSession.bind(UserController));

// ── Admin ─────────────────────────────────────────────────────────────────────
authRouter.post(
  '/force-login',
  authorizationMiddleware,
  (req, res, next) => rbacMiddleware(req, next, Permissions.USER_LOGIN_AS),
  UserController.forceLogin.bind(UserController)
);

module.exports = authRouter;