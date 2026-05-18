const router = require('express').Router()
const { BannerController, BannerTypeController } = require('../controllers/banner')

// Banner types (read-only for now; full CRUD available via /banner-types)
router.get('/types',           BannerTypeController.getAll.bind(BannerTypeController))
router.post('/types',          BannerTypeController.create.bind(BannerTypeController))
router.put('/types/:id',       BannerTypeController.update.bind(BannerTypeController))
router.delete('/types/:id',    BannerTypeController.delete.bind(BannerTypeController))

// Banners CRUD
router.get('/',                BannerController.get.bind(BannerController))
router.post('/reorder',        BannerController.reorder.bind(BannerController))
router.get('/:id',             BannerController.getById.bind(BannerController))
router.post('/',               BannerController.create.bind(BannerController))
router.put('/:id',             BannerController.update.bind(BannerController))
router.delete('/:id',          BannerController.delete.bind(BannerController))
router.delete('/:id/force',    BannerController.forceDelete.bind(BannerController))
router.post('/:id/restore',    BannerController.restore.bind(BannerController))

module.exports = router
