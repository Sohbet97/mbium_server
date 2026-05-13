const RegionController = require('../../controllers/region-controller')
const rbacMiddleware = require('../../middlewares/rbac-middleware')
const Permissions = require('../../utils/permissions')

const regionRouter = require('express').Router()

regionRouter.get('/', (req, res, next) => rbacMiddleware(req, next, Permissions.REGION_GET), RegionController.get.bind(RegionController))

regionRouter.get('/count', (req, res, next) => rbacMiddleware(req, next, Permissions.REGION_GET), RegionController.getCount.bind(RegionController))

regionRouter.get('/:id', (req, res, next) => rbacMiddleware(req, next, Permissions.REGION_GET), RegionController.getById)

regionRouter.post('/', (req, res, next) => rbacMiddleware(req, next, Permissions.REGION_POST), RegionController.create.bind(RegionController))

regionRouter.put('/:id', (req, res, next) => rbacMiddleware(req, next, Permissions.REGION_PUT), RegionController.update.bind(RegionController))

regionRouter.delete('/:id', (req, res, next) => rbacMiddleware(req, next, Permissions.REGION_DELETE), RegionController.delete)

module.exports = regionRouter