const router = require('express').Router()
const ShopService = require('../../__modules__/shops/services/shops')
const AdService = require('../../__modules__/ads/services/ads')
const { FUNCTIONS } = require('../../utils/functions')

// POST /buyer/shops/:id/follow
router.post('/:id/follow', async (req, res, next) => {
    try {
        const result = await ShopService.follow(req.user.id, req.params.id)
        // Only a new follow can earn an ad reward (a follow from before the campaign doesn't)
        const reward = result.created
            ? await AdService.tryReward(req.user.id, 'shop_follow', Number(req.params.id), { shopId: Number(req.params.id) })
            : null
        return res.status(result.created ? 201 : 200).json({ following: true, reward })
    } catch (e) { next(e) }
})

// DELETE /buyer/shops/:id/follow
router.delete('/:id/follow', async (req, res, next) => {
    try {
        await ShopService.unfollow(req.user.id, req.params.id)
        return res.json({ following: false })
    } catch (e) { next(e) }
})

// GET /buyer/shops/followed — shops the current buyer follows
router.get('/followed', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const { rows, count } = await ShopService.getFollowedShops(req.user.id, limit, skip)
        return res.json({ data: rows, count })
    } catch (e) { next(e) }
})

module.exports = router
