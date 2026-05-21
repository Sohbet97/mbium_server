const db = require('../../../models')

class AiRecommendationService {
    static async getAll() {
        return db.AiRecommendation.findAll({
            where: { is_active: true },
            order: [['sort_order', 'ASC'], ['createdAt', 'ASC']],
        })
    }

    static async getAllAdmin() {
        return db.AiRecommendation.findAll({
            order: [['sort_order', 'ASC'], ['createdAt', 'ASC']],
        })
    }

    static async getById(id) {
        if (!id) return null
        return db.AiRecommendation.findOne({ where: { id } })
    }

    static async create(body) {
        return db.AiRecommendation.create(body)
    }

    static async update(id, body) {
        await db.AiRecommendation.update(body, { where: { id } })
        return this.getById(id)
    }

    static async delete(id) {
        return db.AiRecommendation.destroy({ where: { id } })
    }
}

module.exports = AiRecommendationService
