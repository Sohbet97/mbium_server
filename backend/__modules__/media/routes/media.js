const router = require('express').Router()
const ctrl = require('../controllers/media')
const { mediaUpload } = require('../../../utils/upload')

// Library CRUD
router.post('/upload', mediaUpload.single('file'), ctrl.upload)
router.get('/', ctrl.list)
router.get('/:id', ctrl.getOne)
router.patch('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)

// Product ↔ Media attachment
router.get('/product/:product_id', ctrl.getProductMedia)
router.post('/product/:product_id', ctrl.attachToProduct)
router.delete('/product/:product_id/:media_id', ctrl.detachFromProduct)

module.exports = router
