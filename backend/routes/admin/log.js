const LogController = require('../../controllers/log-controller')
const rbacMiddleware = require('../../middlewares/rbac-middleware')
const Permissions = require('../../utils/permissions')

const logRouter = require('express').Router()

logRouter.get('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.LOG_GET), LogController.get.bind(LogController))

logRouter.get('/count', (req, res, next)=>rbacMiddleware(req, next, Permissions.LOG_GET), LogController.getCount.bind(LogController))

logRouter.get('/filter', (req, res, next)=>rbacMiddleware(req, next, Permissions.LOG_GET), LogController.getFilterElements.bind(LogController))

logRouter.get('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.LOG_GET), LogController.getById)

logRouter.delete('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.LOG_DELETE), LogController.delete.bind(LogController))

module.exports = logRouter