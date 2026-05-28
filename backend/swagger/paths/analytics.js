const tag      = "Analytics";
const security = [{ BearerAuth: [] }];

const dateParams = [
    { in: "query", name: "date_from", schema: { type: "string", format: "date" }, description: "Start date (inclusive)" },
    { in: "query", name: "date_to",   schema: { type: "string", format: "date" }, description: "End date (inclusive)" },
];
const periodParam = { in: "query", name: "period", schema: { type: "string", enum: ["day", "week", "month"] }, description: "Grouping granularity (default: day)" };

module.exports = {
    "/admin/analytics/overview": {
        get: {
            tags: [tag], summary: "Platform revenue + order time-series", security,
            parameters: [...dateParams, periodParam],
            responses: {
                200: {
                    description: "Overview summary and revenue series",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyticsOverview" } } },
                },
            },
        },
    },
    "/admin/analytics/shops": {
        get: {
            tags: [tag], summary: "Top shops by revenue", security,
            parameters: [...dateParams, { in: "query", name: "limit", schema: { type: "integer", default: 10 } }],
            responses: {
                200: {
                    description: "Ranked shop list",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyticsShops" } } },
                },
            },
        },
    },
    "/admin/analytics/users": {
        get: {
            tags: [tag], summary: "User registration time-series", security,
            parameters: [...dateParams, periodParam],
            responses: {
                200: {
                    description: "New-user series",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyticsUsers" } } },
                },
            },
        },
    },
    "/admin/analytics/orders": {
        get: {
            tags: [tag], summary: "Order count by status", security,
            parameters: dateParams,
            responses: {
                200: {
                    description: "Order funnel by status",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyticsOrders" } } },
                },
            },
        },
    },
    "/seller/analytics/overview": {
        get: {
            tags: ["Seller"], summary: "Seller revenue + order time-series", security,
            parameters: [...dateParams, periodParam],
            responses: { 200: { description: "Seller overview" } },
        },
    },
    "/seller/analytics/products": {
        get: {
            tags: ["Seller"], summary: "Top products by revenue", security,
            parameters: [...dateParams, { in: "query", name: "limit", schema: { type: "integer", default: 10 } }],
            responses: { 200: { description: "Ranked product list" } },
        },
    },
    "/seller/analytics/payouts": {
        get: {
            tags: ["Seller"], summary: "Payout history time-series", security,
            parameters: [...dateParams, periodParam],
            responses: { 200: { description: "Payout series and balance" } },
        },
    },
};
