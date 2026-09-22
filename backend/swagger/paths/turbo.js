const security = [{ BearerAuth: [] }];
const idParam = { in: "path", name: "id", required: true, schema: { type: "integer" } };

const packageSchema = {
    type: "object",
    properties: {
        id: { type: "integer" },
        tier_hours: { type: "integer", example: 24 },
        price_tmt: { type: "number", nullable: true },
        price_coin: { type: "number", nullable: true },
        duration_days: { type: "integer", example: 7 },
        is_active: { type: "boolean" },
    },
};

const purchaseRequestBody = {
    required: true,
    content: {
        "application/json": {
            schema: {
                type: "object",
                required: ["tier_hours"],
                properties: {
                    tier_hours: { type: "integer", description: "Must match an active package's tier_hours", example: 24 },
                    currency: { type: "string", enum: ["TMT", "COIN"] },
                },
            },
        },
    },
};

// Turbo boosts come in two independent, parallel flows — product-level and
// shop-level — each with its own packages/purchase/status endpoints (not a
// single endpoint with a nullable product_id + target_type).
module.exports = {
    // ── Buyer/seller: product boost ─────────────────────────────────────────────
    "/buyer/turbo/packages": {
        get: {
            tags: ["Turbo Boost"],
            summary: "List active product-boost packages",
            security,
            responses: { 200: { description: "Packages", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: packageSchema } } } } } } },
        },
    },
    "/buyer/turbo/products/{id}/purchase": {
        post: {
            tags: ["Turbo Boost"],
            summary: "Boost a single product",
            description: "Purchases an active-hours boost for one product, owned by the caller's shop.",
            security,
            parameters: [idParam],
            requestBody: purchaseRequestBody,
            responses: {
                201: { description: "Boost created" },
                400: { description: "Aktiwleşdirilen dükaňyz ýok — caller has no active shop" },
            },
        },
    },
    "/buyer/turbo/products/{id}/status": {
        get: {
            tags: ["Turbo Boost"],
            summary: "Get the active boost for a product, if any",
            security,
            parameters: [idParam],
            responses: { 200: { description: "Active boost, or null" } },
        },
    },

    // ── Buyer/seller: shop boost (whole-shop, not tied to one product) ─────────
    "/buyer/turbo/shop-packages": {
        get: {
            tags: ["Turbo Boost"],
            summary: "List active shop-boost packages",
            security,
            responses: { 200: { description: "Packages", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: packageSchema } } } } } } },
        },
    },
    "/buyer/turbo/shop/purchase": {
        post: {
            tags: ["Turbo Boost"],
            summary: "Boost the caller's entire shop",
            description: "Purchases a shop-wide boost for the caller's own shop (resolved from the JWT owner). No product_id involved.",
            security,
            requestBody: purchaseRequestBody,
            responses: {
                201: { description: "Boost created" },
                400: { description: "Aktiwleşdirilen dükaňyz ýok — caller has no active shop" },
            },
        },
    },
    "/buyer/turbo/shop/status": {
        get: {
            tags: ["Turbo Boost"],
            summary: "Get the caller's active shop boost, if any",
            security,
            responses: { 200: { description: "Active boost, or null" } },
        },
    },

    // ── Admin: package CRUD + boost oversight ───────────────────────────────────
    "/admin/turbo/packages": {
        get: { tags: ["Turbo Boost"], summary: "List all product-boost packages", security, responses: { 200: { description: "Packages" } } },
        post: {
            tags: ["Turbo Boost"], summary: "Create a product-boost package", security,
            requestBody: { required: true, content: { "application/json": { schema: packageSchema } } },
            responses: { 201: { description: "Created" } },
        },
    },
    "/admin/turbo/packages/{id}": {
        put: {
            tags: ["Turbo Boost"], summary: "Update a product-boost package", security, parameters: [idParam],
            requestBody: { required: true, content: { "application/json": { schema: packageSchema } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: ["Turbo Boost"], summary: "Delete a product-boost package", security, parameters: [idParam],
            responses: { 200: { description: "Deleted" }, 400: { description: "Package has purchase history" }, 404: { description: "Not found" } },
        },
    },
    "/admin/turbo/boosts": {
        get: {
            tags: ["Turbo Boost"], summary: "List product boosts (oversight)", security,
            parameters: [
                { in: "query", name: "status", schema: { type: "string" } },
                { in: "query", name: "shop_id", schema: { type: "integer" } },
                { in: "query", name: "product_id", schema: { type: "integer" } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 20 } },
            ],
            responses: { 200: { description: "Boost list" } },
        },
    },
    "/admin/turbo/boosts/{id}/cancel": {
        post: {
            tags: ["Turbo Boost"], summary: "Cancel an active product boost (no refund)", security, parameters: [idParam],
            responses: { 200: { description: "Cancelled" }, 400: { description: "Boost is not active" }, 404: { description: "Not found" } },
        },
    },
    "/admin/turbo/shop-packages": {
        get: { tags: ["Turbo Boost"], summary: "List all shop-boost packages", security, responses: { 200: { description: "Packages" } } },
        post: {
            tags: ["Turbo Boost"], summary: "Create a shop-boost package", security,
            requestBody: { required: true, content: { "application/json": { schema: packageSchema } } },
            responses: { 201: { description: "Created" } },
        },
    },
    "/admin/turbo/shop-packages/{id}": {
        put: {
            tags: ["Turbo Boost"], summary: "Update a shop-boost package", security, parameters: [idParam],
            requestBody: { required: true, content: { "application/json": { schema: packageSchema } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: ["Turbo Boost"], summary: "Delete a shop-boost package", security, parameters: [idParam],
            responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } },
        },
    },
    "/admin/turbo/shop-boosts": {
        get: {
            tags: ["Turbo Boost"], summary: "List shop boosts (oversight)", security,
            parameters: [
                { in: "query", name: "status", schema: { type: "string" } },
                { in: "query", name: "shop_id", schema: { type: "integer" } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 20 } },
            ],
            responses: { 200: { description: "Boost list" } },
        },
    },
    "/admin/turbo/shop-boosts/{id}/cancel": {
        post: {
            tags: ["Turbo Boost"], summary: "Cancel an active shop boost (no refund)", security, parameters: [idParam],
            responses: { 200: { description: "Cancelled" }, 404: { description: "Not found" } },
        },
    },
};
