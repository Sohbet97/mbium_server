const router = require('express').Router()
const { Op }                  = require('sequelize')
const db                      = require('../../models')
const ApiError                = require('../../exceptions/api-error')
const PushNotificationService = require('../../__modules__/shops/services/push-notifications')

// GET /seller/push-notifications/customers?text=...
// Returns distinct customers of this shop (from orders), searchable by name/phone
router.get('/customers', async (req, res, next) => {
    try {
        const text = req.query.text?.trim()
        const userWhere = text
            ? {
                [Op.or]: [
                    { name:         { [Op.iLike]: `%${text}%` } },
                    { surname:      { [Op.iLike]: `%${text}%` } },
                    { phone_number: { [Op.iLike]: `%${text}%` } },
                ],
            }
            : {}

        const orders = await db.Order.findAll({
            where:      { shop_id: req.shop.id },
            attributes: ['user_id'],
            group:      ['user_id', 'user.id', 'user.name', 'user.surname', 'user.phone_number', 'user.email'],
            include:    [{ model: db.User, as: 'user', attributes: ['id', 'name', 'surname', 'phone_number', 'email'], where: userWhere }],
            limit:      10,
        })

        const customers = orders.map(o => o.user).filter(Boolean)
        return res.json({ data: customers })
    } catch (e) { next(e) }
})

// GET /seller/push-notifications
router.get('/', async (req, res, next) => {
    try {
        const limit  = Math.min(parseInt(req.query.limit)  || 20, 100)
        const offset = parseInt(req.query.offset) || 0

        const [history, used] = await Promise.all([
            PushNotificationService.getHistory(req.shop.id, limit, offset),
            PushNotificationService.getMonthlyCount(req.shop.id),
        ])

        const quota = req.shop.plan?.push_notif_monthly ?? 0

        return res.json({
            data:  history.rows,
            total: history.count,
            used,
            quota,
        })
    } catch (e) { next(e) }
})

// POST /seller/push-notifications
router.post('/', async (req, res, next) => {
    try {
        const { title, body, imageUrl, data, target } = req.body

        if (!title?.trim() || !body?.trim())
            throw ApiError.BadRequest('title and body are required')

        const campaign = await PushNotificationService.send(
            req.shop.id,
            req.user.id,
            { title: title.trim(), body: body.trim(), imageUrl, data, target },
            req.shop.plan
        )

        return res.status(201).json({ campaign })
    } catch (e) { next(e) }
})

module.exports = router
