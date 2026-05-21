const router = require('express').Router()
const AiRecommendationService = require('../../__modules__/ai/services/ai-recommendations')

// GET /buyer/ai/recommendations  – public, no auth, no pagination
router.get('/recommendations', async (req, res, next) => {
    try {
        const data = await AiRecommendationService.getAll()
        return res.status(200).json({ data })
    } catch (e) { next(e) }
})

module.exports = router
