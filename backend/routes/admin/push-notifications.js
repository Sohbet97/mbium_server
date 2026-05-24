const router = require('express').Router()
const rbacMiddleware           = require('../../middlewares/rbac-middleware')
const Permissions              = require('../../utils/permissions')
const ApiError                 = require('../../exceptions/api-error')
const PushNotificationService  = require('../../__modules__/shops/services/push-notifications')
const { FUNCTIONS }            = require('../../utils/functions')

// GET /admin/push-notifications
router.get('/', (req, res, next) => rbacMiddleware(req, next, Permissions.PUSH_NOTIF_GET),
    async (req, res, next) => {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req)
            const filter = {}
            if (req.query.shop_id) filter.shop_id = req.query.shop_id

            const result = await PushNotificationService.getAllCampaigns(filter, limit, skip)
            return res.json({ data: result.rows, total: result.count })
        } catch (e) { next(e) }
    }
)

// POST /admin/push-notifications
router.post('/', (req, res, next) => rbacMiddleware(req, next, Permissions.PUSH_NOTIF_POST),
    async (req, res, next) => {
        try {
            const { title, body, imageUrl, data, target } = req.body
            if (!title?.trim() || !body?.trim())
                throw ApiError.BadRequest('title and body are required')

            const campaign = await PushNotificationService.sendAsAdmin(
                req.user.id,
                { title: title.trim(), body: body.trim(), imageUrl, data, target }
            )
            return res.status(201).json({ campaign })
        } catch (e) { next(e) }
    }
)

module.exports = router
