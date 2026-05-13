const RoleController = require('../controllers/role-controller')
const rbacMiddleware = require('../../../middlewares/rbac-middleware')
const Permissions = require('../../../utils/permissions')

const roleRouter = require('express').Router()

roleRouter.get('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.ROLE_GET), RoleController.get.bind(RoleController))

roleRouter.get('/count', (req, res, next)=>rbacMiddleware(req, next, Permissions.ROLE_GET), RoleController.getCount.bind(RoleController))

roleRouter.get('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.ROLE_GET), RoleController.getById)

roleRouter.post('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.ROLE_POST), RoleController.create.bind(RoleController))

roleRouter.put('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.ROLE_PUT), RoleController.update.bind(RoleController))

roleRouter.delete('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.ROLE_DELETE), RoleController.delete)

module.exports = roleRouter