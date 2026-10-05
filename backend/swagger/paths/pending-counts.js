const tag      = "PendingCounts";
const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/dashboard": {
        get: {
            tags: ["Dashboard"],
            summary: "Aggregated admin dashboard data (KPIs, series, top shops, coins, recent orders)",
            description: "Each block is present only when the caller holds the matching GET permission: orders/revenue/series/top_shops/recent_orders need ORDER_GET, new_users/users_series need USER_GET, shop totals need SHOP_GET, coins needs COIN_GET. Revenue = CLOSED orders (status 5).",
            security,
            parameters: [{ name: "days", in: "query", schema: { type: "integer", enum: [7, 30], default: 7 }, description: "Window length; the previous window of the same length is used for change_pct" }],
            responses: {
                200: {
                    description: "Dashboard data",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data: {
                                        type: "object",
                                        properties: {
                                            days:             { type: "integer" },
                                            totals:           { type: "object", description: "users, shops, active_shops, orders, revenue (all time)" },
                                            orders:           { type: "object", description: "{ current, previous, change_pct }" },
                                            revenue:          { type: "object", description: "{ current, previous, change_pct }" },
                                            new_users:        { type: "object", description: "{ current, previous, change_pct }" },
                                            orders_series:    { type: "array", items: { type: "object", properties: { day: { type: "string" }, value: { type: "number" } } } },
                                            revenue_series:   { type: "array", items: { type: "object", properties: { day: { type: "string" }, value: { type: "number" } } } },
                                            users_series:     { type: "array", items: { type: "object", properties: { day: { type: "string" }, value: { type: "number" } } } },
                                            orders_by_status: { type: "array", items: { type: "object", properties: { status: { type: "integer" }, count: { type: "integer" } } } },
                                            top_shops:        { type: "array", items: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, revenue: { type: "number" }, orders: { type: "integer" } } } },
                                            recent_orders:    { type: "array", items: { type: "object" } },
                                            coins:            { type: "object", description: "{ in_circulation, spent_by_source: [{ source, spent, count }] }" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    "/admin/pending-counts": {
        get: {
            tags: [tag],
            summary: "Per-resource pending counts for the admin sidebar's red badges",
            description: "Each field is present only when the caller holds the matching GET permission (e.g. `products` requires PRODUCT_GET, `kyc` requires KYC_GET).",
            security,
            responses: {
                200: {
                    description: "Pending counts",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data: {
                                        type: "object",
                                        properties: {
                                            products:         { type: "integer", description: "products.moderation_status = 0" },
                                            reels:            { type: "integer", description: "reels.moderation_status = 0" },
                                            shopApplications: { type: "integer", description: "shops.verification_status = 1" },
                                            shopTypeRequests: { type: "integer", description: "shop_type_change_requests.status = 0" },
                                            kyc:              { type: "integer", description: "kyc_documents.status = 'pending'" },
                                            disputes:         { type: "integer", description: "disputes.status = 'OPEN'" },
                                            payoutRequests:   { type: "integer", description: "payout_requests.status = 'PENDING'" },
                                            banners:          { type: "integer", description: "banners.status = 'PENDING' (seller banners awaiting approval)" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    "/seller/pending-counts": {
        get: {
            tags: [tag],
            summary: "Pending counts for the active shop, for the seller sidebar's red badges",
            description: "All fields are scoped to the caller's active shop (req.shop.id).",
            security,
            responses: {
                200: {
                    description: "Pending counts",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data: {
                                        type: "object",
                                        properties: {
                                            products:         { type: "integer", description: "This shop's products.moderation_status = 0" },
                                            reels:            { type: "integer", description: "This shop's reels.moderation_status = 0" },
                                            payoutRequests:   { type: "integer", description: "This shop's payout_requests.status = 'PENDING'" },
                                            shopTypeRequests: { type: "integer", description: "This shop's shop_type_change_requests.status = 0" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
