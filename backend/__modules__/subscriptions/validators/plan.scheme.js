const yup = require("yup");

const planSchema = yup.object().shape({
    name:                 yup.string().required().max(50),
    display_name_tm:      yup.string().nullable().optional().max(100),
    display_name_ru:      yup.string().nullable().optional().max(100),
    display_name_en:      yup.string().nullable().optional().max(100),
    price_monthly:        yup.number().min(0).required(),
    commission_rate:      yup.number().min(0).max(1).required(),
    product_limit:        yup.number().integer().positive().nullable().optional(),
    hotspot_per_month:    yup.number().integer().min(0).optional(),
    hotspot_duration_hrs: yup.number().integer().min(0).optional(),
    ai_credits_monthly:   yup.number().integer().min(0).optional(),
    auction_per_week:     yup.number().integer().min(0).nullable().optional(),
    live_stream_mode:     yup.number().integer().oneOf([0, 1, 2, 3]).optional(),
    ads_dashboard:        yup.boolean().optional(),
    coin_earn:            yup.boolean().optional(),
    coin_earn_priority:   yup.boolean().optional(),
    verified_badge:       yup.boolean().optional(),
    virtual_tour:         yup.boolean().optional(),
    oem_odm_support:      yup.boolean().optional(),
    revenue_share_user:   yup.number().integer().min(0).max(100).optional(),
    push_notif_monthly:   yup.number().integer().min(0).optional(),
    is_active:            yup.boolean().optional(),
    sort_order:           yup.number().integer().optional(),
});

const subscriptionSchema = yup.object().shape({
    shop_id:   yup.number().integer().required("shop_id is required"),
    plan_id:   yup.number().integer().required("plan_id is required"),
    starts_at: yup.date().nullable().optional(),
    ends_at:   yup.date().nullable().optional(),
    note:      yup.string().nullable().optional(),
});

module.exports = { planSchema, subscriptionSchema };
