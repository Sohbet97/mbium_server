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
// variant_id: omitted in body → shared/product-level (service default). Passed as query
// on GET/DELETE since those have no body; 'null' literal means shared-only there too.
function parseQueryVariantId(req) {
    if (req.query.variant_id === undefined) return undefined
    return req.query.variant_id === 'null' ? null : Number(req.query.variant_id)
}

ctrl.attachToProduct = async (req, res) => {
    try {
        const { product_id } = req.params
        const { media_id, role, sort_order, variant_id } = req.body
        const record = await svc.attachToProduct(product_id, media_id, role, sort_order, variant_id)
        res.status(201).json({ data: record })
    } catch (e) {
        res.status(400).json({ message: e.message })
    }
}

ctrl.updateProductMedia = async (req, res) => {
    try {
        const { product_id, media_id } = req.params
        const { variant_id, ...rest } = req.body
        const record = await svc.updateProductMedia(product_id, media_id, rest, variant_id)
        res.json({ data: record })
    } catch (e) {
        res.status(400).json({ message: e.message })
    }
}

ctrl.detachFromProduct = async (req, res) => {
    try {
        await svc.detachFromProduct(req.params.product_id, req.params.media_id, parseQueryVariantId(req) ?? null)
        res.json({ message: 'Detached' })
    } catch (e) {
        res.status(400).json({ message: e.message })
    }
}

ctrl.getProductMedia = async (req, res) => {
    try {
        const items = await svc.getProductMedia(req.params.product_id, parseQueryVariantId(req))
        res.json({ data: items })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}

module.exports = ctrl
