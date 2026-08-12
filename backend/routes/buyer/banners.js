const router = require('express').Router()
const { BannerController } = require('../../__modules__/banners/controllers/banner')

router.get('/', BannerController.getActive.bind(BannerController))

module.exports = router
