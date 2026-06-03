const router = require('express').Router()
const { Op }                  = require('sequelize')
const authorizationMiddleware = require('../../middlewares/authorization-middleware')
const routeGuard              = require('../../middlewares/route-guard')
const Permissions             = require('../../utils/permissions')
const ApiError                = require('../../exceptions/api-error')
const AiRecommendationService = require('./services/ai-recommendations')
const AiChatService           = require('./services/ai-chat')
const db                      = require('../../models')

// ── Shared chat handler (admin + buyer) ───────────────────────────────────────
async function handleChat(req, res, next) {
    try {
        const { messages } = req.body
        if (!Array.isArray(messages) || !messages.length)
            return res.status(400).json({ message: 'messages[] hökman' })

        const history = messages.slice(-40).map(({ role, content }) => ({
            role: role === 'assistant' ? 'assistant' : 'user',
            content: String(content).slice(0, 5000),
        }))

        await AiChatService.streamChat(history, res)
    } catch (e) { next(e) }
}

// ── Chat (auth only, no extra permission needed) ──────────────────────────────
router.post('/ai/chat', authorizationMiddleware, handleChat)

// ── Conversation history ──────────────────────────────────────────────────────
router.get('/ai/conversations', authorizationMiddleware, async (req, res, next) => {
    try {
        const rows = await db.AiConversation.findAll({
            where: { user_id: req.user.id },
            attributes: ['id', 'title', 'createdAt', 'updatedAt'],
            order: [['updatedAt', 'DESC']],
            limit: 100,
        })
        res.json({ data: rows })
    } catch (e) { next(e) }
})

router.post('/ai/conversations', authorizationMiddleware, async (req, res, next) => {
    try {
        const { title, messages } = req.body
        const conv = await db.AiConversation.create({
            user_id: req.user.id,
            title: String(title ?? 'New chat').slice(0, 200),
            messages: Array.isArray(messages) ? messages : [],
        })
        res.status(201).json({ model: conv })
    } catch (e) { next(e) }
})

router.get('/ai/conversations/:id', authorizationMiddleware, async (req, res, next) => {
    try {
        const conv = await db.AiConversation.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        })
        if (!conv) return res.status(404).json({ message: 'Not found' })
        res.json({ model: conv })
    } catch (e) { next(e) }
})

router.put('/ai/conversations/:id', authorizationMiddleware, async (req, res, next) => {
    try {
        const conv = await db.AiConversation.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        })
        if (!conv) return res.status(404).json({ message: 'Not found' })
        const { title, messages } = req.body
        if (title !== undefined) conv.title = String(title).slice(0, 200)
        if (Array.isArray(messages)) conv.messages = messages
        await conv.save()
        res.json({ model: conv })
    } catch (e) { next(e) }
})

router.delete('/ai/conversations/:id', authorizationMiddleware, async (req, res, next) => {
    try {
        const count = await db.AiConversation.destroy({
            where: { id: req.params.id, user_id: req.user.id },
        })
        if (!count) return res.status(404).json({ message: 'Not found' })
        res.sendStatus(200)
    } catch (e) { next(e) }
})

router.use(authorizationMiddleware)
router.use(routeGuard({
    GET:    Permissions.AI_GET,
    POST:   Permissions.AI_POST,
    PUT:    Permissions.AI_PUT,
    DELETE: Permissions.AI_DELETE,
}))

// GET /admin/ai-recommendations
router.get('/ai-recommendations', async (req, res, next) => {
    try {
        const data = await AiRecommendationService.getAllAdmin()
        return res.status(200).json({ data })
    } catch (e) { next(e) }
})

// POST /admin/ai-recommendations
router.post('/ai-recommendations', async (req, res, next) => {
    try {
        const { title_tk, title_ru, title_en, prompt } = req.body
        if (!title_tk || !title_ru || !title_en || !prompt)
            throw ApiError.BadRequest('title_tk, title_ru, title_en we prompt hökman')
        const model = await AiRecommendationService.create(req.body)
        return res.status(201).json({ model })
    } catch (e) { next(e) }
})

// PUT /admin/ai-recommendations/:id
router.put('/ai-recommendations/:id', async (req, res, next) => {
    try {
        const model = await AiRecommendationService.update(req.params.id, req.body)
        if (!model) throw ApiError.NotFound('Maslahat tapylmady')
        return res.status(200).json({ model })
    } catch (e) { next(e) }
})

// DELETE /admin/ai-recommendations/:id
router.delete('/ai-recommendations/:id', async (req, res, next) => {
    try {
        await AiRecommendationService.delete(req.params.id)
        return res.sendStatus(200)
    } catch (e) { next(e) }
})

module.exports = router
