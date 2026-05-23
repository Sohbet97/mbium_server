const router = require('express').Router()
const authorizationMiddleware = require('../../middlewares/authorization-middleware')
const routeGuard              = require('../../middlewares/route-guard')
const Permissions             = require('../../utils/permissions')
const ApiError                = require('../../exceptions/api-error')
const AiRecommendationService = require('./services/ai-recommendations')
const AiChatService           = require('./services/ai-chat')

// ── Chat (auth only, no extra permission needed) ──────────────────────────────
router.post('/ai/chat', authorizationMiddleware, async (req, res, next) => {
    try {
        const { messages } = req.body
        if (!Array.isArray(messages) || !messages.length)
            return res.status(400).json({ message: 'messages[] hökman' })

        // Sanitise: only allow role + content, max 40 turns
        const history = messages.slice(-40).map(({ role, content }) => ({
            role: role === 'assistant' ? 'assistant' : 'user',
            content: String(content).slice(0, 4000),
        }))

        await AiChatService.streamChat(history, res)
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
