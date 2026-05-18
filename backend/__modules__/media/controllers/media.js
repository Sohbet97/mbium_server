const svc = require('../services/media')

const ctrl = {}

ctrl.upload = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
        const media = await svc.processUpload(req.file, req.user?.id, req.query.media_type)
        res.status(201).json({ data: media })
    } catch (e) {
        res.status(400).json({ message: e.message })
    }
}

ctrl.list = async (req, res) => {
    try {
        const { type, search, page = 1, limit = 40 } = req.query
        const skip = (Number(page) - 1) * Number(limit)
        const result = await svc.list({ type, search }, Number(limit), skip)
        res.json(result)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

ctrl.getOne = async (req, res) => {
    try {
        const m = await svc.getById(req.params.id)
        if (!m) return res.status(404).json({ message: 'Not found' })
        res.json({ data: m })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

ctrl.update = async (req, res) => {
    try {
        const m = await svc.update(req.params.id, req.body)
        res.json({ data: m })
    } catch (e) {
        res.status(400).json({ message: e.message })
    }
}

ctrl.remove = async (req, res) => {
    try {
        await svc.remove(req.params.id)
        res.json({ message: 'Deleted' })
    } catch (e) {
        res.status(400).json({ message: e.message })
    }
}

// Product ↔ Media
ctrl.attachToProduct = async (req, res) => {
    try {
        const { product_id } = req.params
        const { media_id, role, sort_order } = req.body
        const record = await svc.attachToProduct(product_id, media_id, role, sort_order)
        res.status(201).json({ data: record })
    } catch (e) {
        res.status(400).json({ message: e.message })
    }
}

ctrl.updateProductMedia = async (req, res) => {
    try {
        const { product_id, media_id } = req.params
        const record = await svc.updateProductMedia(product_id, media_id, req.body)
        res.json({ data: record })
    } catch (e) {
        res.status(400).json({ message: e.message })
    }
}

ctrl.detachFromProduct = async (req, res) => {
    try {
        await svc.detachFromProduct(req.params.product_id, req.params.media_id)
        res.json({ message: 'Detached' })
    } catch (e) {
        res.status(400).json({ message: e.message })
    }
}

ctrl.getProductMedia = async (req, res) => {
    try {
        const items = await svc.getProductMedia(req.params.product_id)
        res.json({ data: items })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

module.exports = ctrl
