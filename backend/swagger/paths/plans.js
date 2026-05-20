const security = [{ BearerAuth: [] }];
const idParam  = { in: "path", name: "id", required: true, schema: { type: "integer" } };

module.exports = {
    // ── Plans ─────────────────────────────────────────────────────────────────────
    "/admin/plans": {
        get: {
            tags: ["Plans"],
            summary: "List plans",
            security,
            parameters: [
                { in: "query", name: "all",       schema: { type: "boolean" }, description: "Include inactive plans" },
                { in: "query", name: "is_active",  schema: { type: "boolean" } },
                { in: "query", name: "limit",      schema: { type: "integer" } },
                { in: "query", name: "skip",       schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Paginated plan list",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Plan" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
        post: {
            tags: ["Plans"],
            summary: "Create plan",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PlanRequest" } } } },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Plan" } } } } } },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/plans/{id}": {
        get: {
            tags: ["Plans"],
            summary: "Get plan by ID",
            security,
            parameters: [idParam],
            responses: {
                200: { description: "Plan", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Plan" } } } } } },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: ["Plans"],
            summary: "Update plan",
            security,
            parameters: [idParam],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PlanRequest" } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: ["Plans"],
            summary: "Delete plan",
            security,
            parameters: [idParam],
            responses: { 200: { description: "Deleted" } },
        },
    },

    // ── Shop Subscriptions ────────────────────────────────────────────────────────
    "/admin/shop-subscriptions": {
        get: {
            tags: ["Plans"],
            summary: "List shop subscriptions",
            security,
            parameters: [
                { in: "query", name: "shop_id", schema: { type: "integer" } },
                { in: "query", name: "status",  schema: { type: "integer" }, description: "1=active, 2=cancelled, 3=expired" },
                { in: "query", name: "limit",   schema: { type: "integer" } },
                { in: "query", name: "skip",    schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Paginated subscriptions",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/ShopSubscription" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
        post: {
            tags: ["Plans"],
            summary: "Assign subscription to shop (cancels any current active subscription)",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopSubscriptionRequest" } } } },
            responses: {
                201: { description: "Assigned", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/ShopSubscription" } } } } } },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/shop-subscriptions/shop/{shopId}/active": {
        get: {
            tags: ["Plans"],
            summary: "Get the current active subscription for a shop",
            security,
            parameters: [{ in: "path", name: "shopId", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Active subscription or null", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/ShopSubscription" } } } } } },
            },
        },
    },
    "/admin/shop-subscriptions/{id}/status": {
        patch: {
            tags: ["Plans"],
            summary: "Update subscription status (cancel or expire)",
            security,
            parameters: [idParam],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["status"], properties: {
                    status: { type: "integer", description: "2=cancelled, 3=expired" },
                    note:   { type: "string" },
                } } } },
            },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
    },
    "/admin/shop-subscriptions/{id}": {
        delete: {
            tags: ["Plans"],
            summary: "Remove subscription record",
            security,
            parameters: [idParam],
            responses: { 200: { description: "Removed" } },
        },
    },
};
