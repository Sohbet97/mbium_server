const router          = require('express').Router()
const routeGuard      = require('../../middlewares/route-guard')
const Permissions     = require('../../utils/permissions')
const ApiError        = require('../../exceptions/api-error')
const db              = require('../../models')
const { FUNCTIONS }   = require('../../utils/functions')
const ReelGiftService = require('./services/reelGifts')

// Separate router from reels/index.js — that one's routeGuard gates the whole router on
// REEL_* permissions, but gift-types needs its own GIFT_TYPE_* permission set.
router.use(routeGuard({
    GET:    Permissions.GIFT_TYPE_GET,
    POST:   Permissions.GIFT_TYPE_POST,
    PUT:    Permissions.GIFT_TYPE_PUT,
    DELETE: Permissions.GIFT_TYPE_DELETE,
}))

const GIFT_TYPE_INCLUDE = [
    { model: db.Media, as: 'animation', attributes: ['id', 'url', 'mime_type'] },
    { model: db.Media, as: 'icon', attributes: ['id', 'url'], required: false },
    { model: db.GiftCreator, as: 'gift_creator', attributes: ['id', 'name'] },
]

// GET /admin/gift-types — admin sees active AND inactive
router.get('/gift-types', async (req, res, next) => {
    try {
        const data = await db.GiftType.findAll({
            order: [['sort_order', 'ASC']],
            include: GIFT_TYPE_INCLUDE,
        })
        return res.json({ data })
    } catch (e) { next(e) }
})

router.get('/gift-types/:id', async (req, res, next) => {
    try {
        const model = await db.GiftType.findOne({ where: { id: req.params.id }, include: GIFT_TYPE_INCLUDE })
        if (!model) throw ApiError.NotFound('Sowgat görnüşi tapylmady')
        return res.json({ model })
    } catch (e) { next(e) }
})

// POST /admin/gift-types — animation_id must already be an uploaded Media row (via the
// existing generic media endpoint); this reclassifies it to type='gift' for filtering.
router.post('/gift-types', async (req, res, next) => {
    try {
        const { name, animation_id, icon_id, effect_description, price_coin, price_tmt, gift_creator_id, sort_order } = req.body
        if (!name) throw ApiError.BadRequest('Ady hökman')
        if (!animation_id) throw ApiError.BadRequest('animation_id hökman')
        if (!price_coin) throw ApiError.BadRequest('price_coin hökman')
        if (!price_tmt) throw ApiError.BadRequest('price_tmt hökman')
        if (!gift_creator_id) throw ApiError.BadRequest('gift_creator_id hökman')

        const media = await db.Media.findByPk(animation_id)
        if (!media) throw ApiError.NotFound('Surat/animasiýa tapylmady')
        if (media.type !== 'gift') await media.update({ type: 'gift' })

        const creator = await db.GiftCreator.findByPk(gift_creator_id)
        if (!creator) throw ApiError.NotFound('Sowgat awtory tapylmady')

        const model = await db.GiftType.create({
            name,
            animation_id,
            icon_id: icon_id || null,
            effect_description: effect_description || null,
            price_coin,
            price_tmt,
            gift_creator_id,
            sort_order: sort_order ?? 0,
        })
        return res.status(201).json({ model: await db.GiftType.findOne({ where: { id: model.id }, include: GIFT_TYPE_INCLUDE }) })
    } catch (e) { next(e) }
})

// PUT /admin/gift-types/:id — edit price/name/creator/is_active/sort_order
router.put('/gift-types/:id', async (req, res, next) => {
    try {
        const model = await db.GiftType.findOne({ where: { id: req.params.id } })
        if (!model) throw ApiError.NotFound('Sowgat görnüşi tapylmady')

        if (req.body.gift_creator_id) {
            const creator = await db.GiftCreator.findByPk(req.body.gift_creator_id)
            if (!creator) throw ApiError.NotFound('Sowgat awtory tapylmady')
        }
        if (req.body.animation_id) {
            const media = await db.Media.findByPk(req.body.animation_id)
            if (!media) throw ApiError.NotFound('Surat/animasiýa tapylmady')
            if (media.type !== 'gift') await media.update({ type: 'gift' })
        }

        await model.update(req.body)
        return res.json({ model: await db.GiftType.findOne({ where: { id: req.params.id }, include: GIFT_TYPE_INCLUDE }) })
    } catch (e) { next(e) }
})

// DELETE /admin/gift-types/:id
router.delete('/gift-types/:id', async (req, res, next) => {
    try {
        await db.GiftType.destroy({ where: { id: req.params.id } })
        return res.sendStatus(200)
    } catch (e) { next(e) }
})

// GET /admin/reel-gifts — read-only audit feed of every gift sent on any reel
router.get('/reel-gifts', async (req, res, next) => {
    try {
        const { limit, skip } = FUNCTIONS.getQueryParams(req)
        const filter = {}
        if (req.query.reel_id)         filter.reel_id = req.query.reel_id
        if (req.query.gift_creator_id) filter.gift_creator_id = req.query.gift_creator_id

        const { rows: data, count } = await ReelGiftService.getAll(filter, limit, skip)
        return res.json({ data, count })
    } catch (e) { next(e) }
})

module.exports = router
