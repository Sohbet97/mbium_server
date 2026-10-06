const { Op } = require('sequelize')
const db = require('../../../models')
const { sendMulticastNotification } = require('../../../utils/firebase')
const PlanLimits = require('../../../services/plan-limits')

class PushNotificationService {

    static async getMonthlyCount(shopId) {
        const start = new Date()
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        return db.PushNotificationCampaign.count({
            where: {
                shop_id:    shopId,
                status:     1,
                createdAt: { [Op.gte]: start },
            },
        })
    }

    static async getHistory(shopId, limit = 20, offset = 0) {
        return db.PushNotificationCampaign.findAndCountAll({
            where:   { shop_id: shopId },
            order:   [['createdAt', 'DESC']],
            limit,
            offset,
            include: [{
                model:      db.User,
                as:         'sender',
                attributes: ['id', 'name', 'surname'],
            }],
        })
    }

    // shopId scopes 'ordered' to a specific shop's customers (seller context)
    static async _resolveTokens(target = {}, shopId = null) {
        const { type = 'all', days, user_ids } = target
        const base = { device_tokens: { [Op.ne]: [] } }

        if (type === 'specific' && Array.isArray(user_ids) && user_ids.length > 0) {
            const users = await db.User.findAll({
                where: { ...base, id: { [Op.in]: user_ids } },
                attributes: ['device_tokens'],
            })
            return users.flatMap(u => Array.isArray(u.device_tokens) ? u.device_tokens : [])
        }

        if (type === 'active_days') {
            const since = new Date()
            since.setDate(since.getDate() - (Number(days) || 7))
            const users = await db.User.findAll({
                where: { ...base, last_login_date: { [Op.gte]: since } },
                attributes: ['device_tokens'],
            })
            return users.flatMap(u => Array.isArray(u.device_tokens) ? u.device_tokens : [])
        }

        if (type === 'ordered') {
            const orderWhere = shopId ? { shop_id: shopId } : {}
            const buyerIds = await db.Order.findAll({
                where:      orderWhere,
                attributes: ['user_id'],
                group:      ['user_id'],
                raw:        true,
            }).then(rows => rows.map(r => r.user_id))
            if (!buyerIds.length) return []
            const users = await db.User.findAll({
                where: { ...base, id: { [Op.in]: buyerIds } },
                attributes: ['device_tokens'],
            })
            return users.flatMap(u => Array.isArray(u.device_tokens) ? u.device_tokens : [])
        }

        // 'all' — default
        const users = await db.User.findAll({ where: base, attributes: ['device_tokens'] })
        return users.flatMap(u => Array.isArray(u.device_tokens) ? u.device_tokens : [])
    }

    static async _dispatch(shopId, createdBy, { title, body, imageUrl, data, target }) {
        const tokens = await this._resolveTokens(target, shopId)

        const campaign = await db.PushNotificationCampaign.create({
            shop_id:         shopId,
            created_by:      createdBy,
            title,
            body,
            image_url:       imageUrl ?? null,
            data:            data ?? null,
            status:          0,
            recipient_count: tokens.length,
        })

        try {
            const result = await sendMulticastNotification(
                tokens,
                { title, body, imageUrl },
                data ?? {}
            )
            // "Sent" only when FCM actually accepted at least one message
            await campaign.update({
                status:        result.successCount > 0 ? 1 : 2,
                sent_at:       new Date(),
                success_count: result.successCount,
                fail_count:    result.failureCount,
            })
            if (result.invalidTokens?.length) {
                await this._pruneTokens(result.invalidTokens)
                    .catch(e => console.warn('[Push] token prune failed:', e.message))
            }
        } catch (err) {
            await campaign.update({ status: 2, sent_at: new Date(), fail_count: tokens.length })
            console.error('[Push] dispatch failed:', err.message)
            throw err
        }

        return campaign
    }

    // Remove tokens FCM reported as permanently invalid from every user that holds them
    static async _pruneTokens(badTokens) {
        await db.sequelize.query(
            `UPDATE users
                SET device_tokens = COALESCE((
                    SELECT jsonb_agg(t) FROM jsonb_array_elements(device_tokens) AS t
                    WHERE (t #>> '{}') <> ALL(ARRAY[:bad]::text[])
                ), '[]'::jsonb)
              WHERE device_tokens ?| ARRAY[:bad]::text[]`,
            { replacements: { bad: badTokens } }
        )
    }

    static async send(shopId, createdBy, { title, body, imageUrl, data, target }, plan) {
        const used = await this.getMonthlyCount(shopId)
        PlanLimits.assertQuota(plan, 'push_notif_monthly', used)

        // A seller may only reach their own customers (or specific users), never the whole platform
        const type = target?.type
        const scoped = !type || type === 'all' ? { ...target, type: 'ordered' } : target

        return this._dispatch(shopId, createdBy, { title, body, imageUrl, data, target: scoped })
    }

    // Admin send — no quota check; shop_id may be null for platform-wide blasts
    static async sendAsAdmin(createdBy, { title, body, imageUrl, data, target }) {
        return this._dispatch(null, createdBy, { title, body, imageUrl, data, target })
    }

    static async getAllCampaigns(filter = {}, limit = 20, offset = 0) {
        return db.PushNotificationCampaign.findAndCountAll({
            where:   filter,
            order:   [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                { model: db.User, as: 'sender', attributes: ['id', 'name', 'surname'] },
                { model: db.Shop, as: 'shop',   attributes: ['id', 'name'] },
            ],
        })
    }
}

module.exports = PushNotificationService
