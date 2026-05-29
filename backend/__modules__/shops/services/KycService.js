const db = require('../../../models')

class KycService {
    static async getByShop(shopId) {
        return db.KycDocument.findAll({
            where:   { shop_id: shopId },
            include: [{ model: db.User, as: 'reviewer', attributes: ['id', 'name', 'surname'] }],
            order:   [['createdAt', 'DESC']],
        })
    }

    static async getAll({ status, shop_id, limit = 20, skip = 0 } = {}) {
        const where = {}
        if (status)  where.status  = status
        if (shop_id) where.shop_id = shop_id

        return db.KycDocument.findAndCountAll({
            where,
            include: [
                { model: db.User, as: 'reviewer', attributes: ['id', 'name', 'surname'] },
                { model: db.Shop, as: 'shop',     attributes: ['id', 'name'] },
            ],
            order:  [['createdAt', 'DESC']],
            limit,
            offset: skip,
        })
    }

    static async create(shopId, { type, file_url, note }) {
        return db.KycDocument.create({ shop_id: shopId, type, file_url, note: note ?? null })
    }

    static async setStatus(id, status, reviewerId, note) {
        const doc = await db.KycDocument.findByPk(id)
        if (!doc) throw Object.assign(new Error('KYC document not found'), { status: 404 })
        await doc.update({
            status,
            reviewed_by: reviewerId,
            reviewed_at: new Date(),
            note:        note ?? doc.note,
        })
        return doc
    }

    static async delete(id) {
        const doc = await db.KycDocument.findByPk(id)
        if (!doc) throw Object.assign(new Error('KYC document not found'), { status: 404 })
        await doc.destroy()
    }
}

module.exports = KycService
