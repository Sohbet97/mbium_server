const CommentService = require('../services/CommentService')

class CommentController {
    static async getAll(req, res, next) {
        try {
            const { status, product_id, limit = 20, skip = 0 } = req.query
            const result = await CommentService.getAll({
                status, product_id: product_id ? Number(product_id) : undefined,
                limit: Number(limit), skip: Number(skip),
            })
            res.json({ data: result.rows, count: result.count })
        } catch (e) { next(e) }
    }

    static async getByProduct(req, res, next) {
        try {
            const { limit = 20, skip = 0 } = req.query
            const result = await CommentService.getApproved(Number(req.params.productId), {
                limit: Number(limit), skip: Number(skip),
            })
            res.json({ data: result.rows, count: result.count })
        } catch (e) { next(e) }
    }

    static async create(req, res, next) {
        try {
            const { body, parent_id } = req.body
            if (!body?.trim()) return res.status(400).json({ message: 'Body is required' })
            const comment = await CommentService.create(
                req.user.id,
                Number(req.params.productId),
                body.trim(),
                parent_id ?? null,
            )
            res.status(201).json(comment)
        } catch (e) { next(e) }
    }

    static async setStatus(req, res, next) {
        try {
            const { status } = req.body
            if (!['pending', 'approved', 'rejected'].includes(status))
                return res.status(400).json({ message: 'Invalid status' })
            const comment = await CommentService.setStatus(Number(req.params.id), status)
            res.json(comment)
        } catch (e) { next(e) }
    }

    static async delete(req, res, next) {
        try {
            await CommentService.delete(Number(req.params.id))
            res.json({ success: true })
        } catch (e) { next(e) }
    }
}

module.exports = CommentController
