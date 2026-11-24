const RegionController = require('../../controllers/region-controller')
const CityController = require('../../controllers/city-controller')
const DistrictController = require('../../controllers/district-controller')

const router = require('express').Router()

router.get('/regions', RegionController.get.bind(RegionController))
router.get('/regions/:id', RegionController.getById)

router.get('/cities', CityController.get.bind(CityController))
router.get('/cities/:id', CityController.getById)

router.get('/districts', DistrictController.get.bind(DistrictController))
router.get('/districts/:id', DistrictController.getById)

module.exports = router
