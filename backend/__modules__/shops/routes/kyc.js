const router = require('express').Router({ mergeParams: true })
const KycController = require('../controllers/kyc.controller')
const { kycUpload } = require('../../../utils/upload')

// All mounted under /shops/:shopId/kyc — guard applied in index.js
router.get('/',    KycController.getByShop)
router.post('/',   KycController.create)

// Upload a file and return its URL (use file_url in POST above)
router.post('/upload', kycUpload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    res.json({ file_url: `/static/shop-docs/${req.file.filename}` })
})

router.patch('/:docId/status', KycController.setStatus)
router.delete('/:docId',       KycController.delete)

module.exports = router
