const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
        res.setHeader('X-Accel-Buffering', 'no') // disable nginx buffering

        const stream = await client.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages,
        })

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            }
        }

        res.write('data: [DONE]\n\n')
        res.end()
    }
}

module.exports = AiChatService
