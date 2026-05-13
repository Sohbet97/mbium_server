const CityController = require('../../controllers/city-controller')
const rbacMiddleware = require('../../middlewares/rbac-middleware')
const Permissions = require('../../utils/permissions')

const cityRouter = require('express').Router()

cityRouter.get('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.VILLAGE_GET), CityController.get.bind(CityController))

cityRouter.get('/count', (req, res, next)=>rbacMiddleware(req, next, Permissions.VILLAGE_GET), CityController.getCount.bind(CityController))

cityRouter.get('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.VILLAGE_GET), CityController.getById)

cityRouter.post('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.VILLAGE_POST), CityController.create.bind(CityController))

cityRouter.put('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.VILLAGE_PUT), CityController.update.bind(CityController))

cityRouter.delete('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.VILLAGE_DELETE), CityController.delete)

module.exports = cityRouter