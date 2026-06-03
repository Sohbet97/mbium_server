const router  = require('express').Router()
const { Op }  = require('sequelize')
const db      = require('../../models')

// GET /buyer/notifications?limit=20&page=1
router.get('/', async (req, res, next) => {
    try {
        const limit  = Math.min(parseInt(req.query.limit) || 20, 100)
        const page   = Math.max(parseInt(req.query.page)  || 1,  1)
        const offset = (page - 1) * limit

        const { count, rows } = await db.Notification.findAndCountAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        })
        return res.json({ data: rows, count })
    } catch (e) { next(e) }
})

// PATCH /buyer/notifications/:id/read  — mark one as read
router.patch('/:id/read', async (req, res, next) => {
    try {
        const n = await db.Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } })
        if (!n) return res.status(404).json({ message: 'Notification tapylmady' })
        await n.update({ status: 1, read_at: new Date() })
        return res.json({ ok: true })
    } catch (e) { next(e) }
})

// PATCH /buyer/notifications/read-all  — mark all unread as read
router.patch('/read-all', async (req, res, next) => {
    try {
        await db.Notification.update(
            { status: 1, read_at: new Date() },
            { where: { user_id: req.user.id, status: 0 } }
        )
        return res.json({ ok: true })
    } catch (e) { next(e) }
})

// DELETE /buyer/notifications/:id  — delete one notification
router.delete('/:id', async (req, res, next) => {
    try {
        const deleted = await db.Notification.destroy({ where: { id: req.params.id, user_id: req.user.id } })
        if (!deleted) return res.status(404).json({ message: 'Notification tapylmady' })
        return res.sendStatus(200)
    } catch (e) { next(e) }
})

// DELETE /buyer/notifications  — delete all read notifications for this user
router.delete('/', async (req, res, next) => {
    try {
        await db.Notification.destroy({ where: { user_id: req.user.id, status: 1 } })
        return res.json({ ok: true })
    } catch (e) { next(e) }
})

module.exports = router
