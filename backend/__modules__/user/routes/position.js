const PositionController = require('../controllers/position-controller')
const rbacMiddleware = require('../../../middlewares/rbac-middleware')
const Permissions = require('../../../utils/permissions')

const positionRouter = require('express').Router()

positionRouter.get('/', (req, res, next) => rbacMiddleware(req, next, Permissions.USER_POSITION_GET), PositionController.get.bind(PositionController))

positionRouter.get('/filter', (req, res, next) => rbacMiddleware(req, next, Permissions.USER_POSITION_GET), PositionController.getElements.bind(PositionController))

positionRouter.get('/count', (req, res, next) => rbacMiddleware(req, next, Permissions.USER_POSITION_GET), PositionController.getCount.bind(PositionController))

positionRouter.get('/by-departments', (req, res, next) => rbacMiddleware(req, next, Permissions.USER_POSITION_GET), PositionController.getByDepartment.bind(PositionController))

positionRouter.get('/:id', (req, res, next) => rbacMiddleware(req, next, Permissions.USER_POSITION_GET), PositionController.getById)

positionRouter.post('/', (req, res, next) => rbacMiddleware(req, next, Permissions.USER_POSITION_POST), PositionController.create.bind(PositionController))

positionRouter.put('/:id', (req, res, next) => rbacMiddleware(req, next, Permissions.USER_POSITION_PUT), PositionController.update.bind(PositionController))

positionRouter.delete('/:id', (req, res, next) => rbacMiddleware(req, next, Permissions.USER_POSITION_DELETE), PositionController.delete)

module.exports = positionRouter