const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const SYSTEM_PROMPT = `You are an AI assistant embedded in the mbium admin panel — a B2C/B2B marketplace platform for Turkmenistan. You help platform administrators and sellers with:
- Product listing advice and optimisation
- Market trends and insights for Turkmenistan
- Order and customer service guidance
- Shop setup and category recommendations
- Pricing and discount strategy
- Platform-specific questions (how features work, best practices)

Be concise, practical, and friendly. Respond in the same language the user writes in (Turkmen, Russian, or English). When relevant, suggest actionable next steps an admin can take directly in the platform.

Platform context:
- Marketplace operating in Turkmenistan (TMT currency)
- Sellers manage shops, products, orders, discounts, banners, and payouts
- Buyers browse, place orders, and leave reviews via a Flutter mobile app
- The admin panel is web-based (React)`

class AiChatService {
    /**
     * Streams a chat response to an Express res object using SSE.
     * @param {Array<{role: string, content: string}>} messages
     * @param {import('express').Response} res
     */
    static async streamChat(messages, res) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: SYSTEM_PROMPT,
        })

        // Gemini uses 'model' role instead of 'assistant'
        const history = messages.slice(0, -1).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }))
        const lastMessage = messages[messages.length - 1].content

        const chat = model.startChat({ history })
        const result = await chat.sendMessageStream(lastMessage)

        for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`)
        }

        res.write('data: [DONE]\n\n')
        res.end()
    }
}

module.exports = AiChatService
