const router = require('express').Router()
const AiRecommendationService = require('../../__modules__/ai/services/ai-recommendations')
const AiChatService           = require('../../__modules__/ai/services/ai-chat')
const authorizationMiddleware = require('../../middlewares/authorization-middleware')
const db                      = require('../../models')

// GET /buyer/ai/recommendations  – public, no auth
router.get('/recommendations', async (req, res, next) => {
    try {
        const data = await AiRecommendationService.getAll()
        return res.status(200).json({ data })
    } catch (e) { next(e) }
})

// POST /buyer/ai/chat  – requires auth
router.post('/chat', authorizationMiddleware, async (req, res, next) => {
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
})

// GET /buyer/ai/conversations  – requires auth
router.get('/conversations', authorizationMiddleware, async (req, res, next) => {
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

// POST /buyer/ai/conversations
router.post('/conversations', authorizationMiddleware, async (req, res, next) => {
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

// GET /buyer/ai/conversations/:id
router.get('/conversations/:id', authorizationMiddleware, async (req, res, next) => {
    try {
        const conv = await db.AiConversation.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        })
        if (!conv) return res.status(404).json({ message: 'Not found' })
        res.json({ model: conv })
    } catch (e) { next(e) }
})

// PUT /buyer/ai/conversations/:id
router.put('/conversations/:id', authorizationMiddleware, async (req, res, next) => {
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

// DELETE /buyer/ai/conversations/:id
router.delete('/conversations/:id', authorizationMiddleware, async (req, res, next) => {
    try {
        const count = await db.AiConversation.destroy({
            where: { id: req.params.id, user_id: req.user.id },
        })
        if (!count) return res.status(404).json({ message: 'Not found' })
        res.sendStatus(200)
    } catch (e) { next(e) }
})

module.exports = router
