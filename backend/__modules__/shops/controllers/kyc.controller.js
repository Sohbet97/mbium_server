const KycService = require('../services/KycService')

class KycController {
    static async getByShop(req, res, next) {
        try {
            const docs = await KycService.getByShop(Number(req.params.shopId))
            res.json(docs)
        } catch (e) { next(e) }
    }

    static async getAll(req, res, next) {
        try {
            const { status, shop_id, limit = 20, skip = 0 } = req.query
            const result = await KycService.getAll({
                status,
                shop_id: shop_id ? Number(shop_id) : undefined,
                limit: Number(limit),
                skip:  Number(skip),
            })
            res.json({ data: result.rows, count: result.count })
        } catch (e) { next(e) }
    }

    static async create(req, res, next) {
        try {
            const { type, file_url, note } = req.body
            if (!type || !file_url) return res.status(400).json({ message: 'type and file_url are required' })
            const doc = await KycService.create(Number(req.params.shopId), { type, file_url, note })
            res.status(201).json(doc)
        } catch (e) { next(e) }
    }

    static async setStatus(req, res, next) {
        try {
            const { status, note } = req.body
            const allowed = ['pending', 'approved', 'rejected']
            if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' })
            const doc = await KycService.setStatus(Number(req.params.docId), status, req.user.id, note)
            res.json(doc)
        } catch (e) { next(e) }
    }

    static async delete(req, res, next) {
        try {
            await KycService.delete(Number(req.params.docId))
            res.json({ success: true })
        } catch (e) { next(e) }
    }
}

module.exports = KycController
