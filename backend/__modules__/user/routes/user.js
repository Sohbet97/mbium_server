const userRouter = require('express').Router();
const rbacMiddleware = require('../../../middlewares/rbac-middleware');
const Permissions = require('../../../utils/permissions');
const UserController = require('../controllers/user-controller');

const rbac = (permission) => (req, res, next) => rbacMiddleware(req, next, permission);

userRouter.get('/',        rbac(Permissions.USER_GET),    UserController.get.bind(UserController));
userRouter.get('/:id',     rbac(Permissions.USER_GET),    UserController.getById.bind(UserController));

userRouter.post('/',       rbac(Permissions.USER_POST),   UserController.create.bind(UserController));

userRouter.put('/:id',         rbac(Permissions.USER_PUT), UserController.update.bind(UserController));
userRouter.put('/:id/unlock',  rbac(Permissions.USER_PUT), UserController.unlockUser.bind(UserController));

userRouter.delete('/:id',       rbac(Permissions.USER_DELETE), UserController.delete.bind(UserController));
userRouter.delete('/:id/force', rbac(Permissions.USER_DELETE), UserController.forceDelete.bind(UserController));

module.exports = userRouter;