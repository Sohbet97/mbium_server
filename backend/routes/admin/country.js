const CountryController = require('../../controllers/country-controller')
const rbacMiddleware = require('../../middlewares/rbac-middleware')
const Permissions = require('../../utils/permissions')
const router = require('express').Router()

router.get('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.COUNTRY_GET), CountryController.getAll.bind(CountryController))

router.get('/count', (req, res, next)=>rbacMiddleware(req, next, Permissions.COUNTRY_GET), CountryController.getCount.bind(CountryController))

router.get('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.COUNTRY_GET), CountryController.getById)

router.post('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.COUNTRY_POST), CountryController.create.bind(CountryController))

router.put('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.COUNTRY_PUT), CountryController.update.bind(CountryController))

router.delete('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.COUNTRY_DELETE), CountryController.deleteById)

module.exports = router
