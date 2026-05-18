const db = require("../../../models");

class PlanService {
    static async getAll(includeInactive = false) {
        const where = includeInactive ? {} : { is_active: true };
        return db.Plan.findAll({ where, order: [["sort_order", "ASC"], ["id", "ASC"]] });
    }

    static async getById(id) {
        if (!id) return null;
        return db.Plan.findOne({ where: { id } });
    }

    static async create(data) {
        return db.Plan.create({
            name:                 data.name,
            display_name_tm:      data.display_name_tm ?? null,
            display_name_ru:      data.display_name_ru ?? null,
            display_name_en:      data.display_name_en ?? null,
            price_monthly:        data.price_monthly ?? 0,
            commission_rate:      data.commission_rate ?? 0.15,
            product_limit:        data.product_limit ?? null,
            hotspot_per_month:    data.hotspot_per_month ?? 0,
            hotspot_duration_hrs: data.hotspot_duration_hrs ?? 0,
            ai_credits_monthly:   data.ai_credits_monthly ?? 5,
            auction_per_week:     data.auction_per_week ?? null,
            live_stream_mode:     data.live_stream_mode ?? 0,
            ads_dashboard:        data.ads_dashboard ?? false,
            coin_earn:            data.coin_earn ?? false,
            coin_earn_priority:   data.coin_earn_priority ?? false,
            verified_badge:       data.verified_badge ?? false,
            virtual_tour:         data.virtual_tour ?? false,
            oem_odm_support:      data.oem_odm_support ?? false,
            revenue_share_user:   data.revenue_share_user ?? 0,
            push_notif_monthly:   data.push_notif_monthly ?? 0,
            is_active:            data.is_active ?? true,
            sort_order:           data.sort_order ?? 0,
        });
    }

    static async update(id, data) {
        const fields = [
            "name", "display_name_tm", "display_name_ru", "display_name_en",
            "price_monthly", "commission_rate", "product_limit",
            "hotspot_per_month", "hotspot_duration_hrs", "ai_credits_monthly",
            "auction_per_week", "live_stream_mode",
            "ads_dashboard", "coin_earn", "coin_earn_priority",
            "verified_badge", "virtual_tour", "oem_odm_support",
            "revenue_share_user", "push_notif_monthly", "is_active", "sort_order",
        ];
        const patch = {};
        fields.forEach((f) => { if (data[f] !== undefined) patch[f] = data[f]; });
        return db.Plan.update(patch, { where: { id } });
    }

    static async remove(id) {
        return db.Plan.destroy({ where: { id } });
    }
}

module.exports = PlanService;
