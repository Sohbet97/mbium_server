const { Op } = require('sequelize')
const db = require('../../../models')

const AUTHOR_ATTRS = ['id', 'name', 'surname', 'thumbnail']

class CommentService {
    static _include(withReplies = false) {
        const base = [{ model: db.User, as: 'author', attributes: AUTHOR_ATTRS }]
        if (withReplies) {
            base.push({
                model:   db.Comment,
                as:      'replies',
                where:   { status: 'approved', parent_id: { [Op.ne]: null } },
                required: false,
                include: [{ model: db.User, as: 'author', attributes: AUTHOR_ATTRS }],
            })
        }
        return base
    }

    // Buyer: approved root-level comments for a product (with their approved replies)
    static async getApproved(productId, { limit = 20, skip = 0 } = {}) {
        return db.Comment.findAndCountAll({
            where:   { product_id: productId, status: 'approved', parent_id: null },
            include: this._include(true),
            order:   [['createdAt', 'DESC']],
            limit,
            offset:  skip,
        })
    }

    // Admin: all comments with optional filters
    static async getAll({ status, product_id, limit = 20, skip = 0 } = {}) {
        const where = {}
        if (status)     where.status     = status
        if (product_id) where.product_id = product_id

        return db.Comment.findAndCountAll({
            where,
            include: [
                { model: db.User,    as: 'author',  attributes: AUTHOR_ATTRS },
                { model: db.Product, as: 'product', attributes: ['id', 'name'] },
            ],
            order:  [['createdAt', 'DESC']],
            limit,
            offset: skip,
        })
    }

    static async create(userId, productId, body, parentId = null) {
        if (parentId) {
            const parent = await db.Comment.findOne({
                where: { id: parentId, product_id: productId, status: 'approved' },
            })
            if (!parent) throw Object.assign(new Error('Parent comment not found'), { status: 404 })
        }
        return db.Comment.create({ user_id: userId, product_id: productId, body, parent_id: parentId ?? null })
    }

    static async setStatus(id, status) {
        const comment = await db.Comment.findByPk(id)
        if (!comment) throw Object.assign(new Error('Comment not found'), { status: 404 })
        await comment.update({ status })
        return comment
    }

    static async delete(id) {
        const comment = await db.Comment.findByPk(id)
        if (!comment) throw Object.assign(new Error('Comment not found'), { status: 404 })
        await comment.destroy()
    }
}

module.exports = CommentService
