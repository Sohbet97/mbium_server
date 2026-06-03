const security = [{ BearerAuth: [] }];
const idParam  = { in: "path", name: "id", required: true, schema: { type: "integer" } };

const paginationParams = [
    { in: "query", name: "page",  schema: { type: "integer", default: 1 } },
    { in: "query", name: "limit", schema: { type: "integer", default: 20 } },
];

const productSortParam = {
    in: "query",
    name: "sort",
    description: "Sort order for product listings",
    schema: {
        type: "string",
        default: "newest",
        enum: [
            "newest",     // createdAt DESC (default)
            "oldest",     // createdAt ASC
            "price_asc",  // price ASC
            "price_desc", // price DESC
            "rating",     // rating DESC, review_count DESC
            "popular",    // review_count DESC, rating DESC
            "name_asc",   // name ASC
            "name_desc",  // name DESC
            "updated",    // updatedAt DESC
        ],
    },
};

// All /buyer/catalog/* and /buyer/ai/* are public (no auth).
// /buyer/cart, /buyer/orders, /buyer/addresses, /buyer/reviews require auth.
module.exports = {

    // ── Shop Types ────────────────────────────────────────────────────────────────

    "/buyer/shop-types": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "List active shop types (public)",
            description: "Returns all shop types where `is_active` is true. No auth required.",
            parameters: [
                {
                    in: "query",
                    name: "sort",
                    required: false,
                    schema: {
                        type: "string",
                        enum: ["order", "name", "-name"],
                        default: "order",
                    },
                    description: "Sort order: `order` — by admin-set position (default), `name` — alphabetical A→Z, `-name` — alphabetical Z→A",
                },
            ],
            responses: {
                200: {
                    description: "Active shop types",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/ShopType" } },
                    } } } },
                },
            },
        },
    },

    // ── Unified full-text search ──────────────────────────────────────────────────

    "/buyer/catalog/search": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "Unified full-text search (products + categories + shops)",
            description:
                "Runs PostgreSQL full-text search (`to_tsvector` + `to_tsquery`) across " +
                "products, categories, and shops in parallel and returns all three result sets. " +
                "Results are ranked by `ts_rank`. Supports prefix matching (e.g. `iph` → iPhone). " +
                "Returns empty arrays for blank `q`.",
            parameters: [
                { in: "query", name: "q",              required: true,  schema: { type: "string" }, description: "Search query" },
                { in: "query", name: "product_limit",  required: false, schema: { type: "integer", default: 20, maximum: 50 } },
                { in: "query", name: "category_limit", required: false, schema: { type: "integer", default: 8,  maximum: 20 } },
                { in: "query", name: "shop_limit",     required: false, schema: { type: "integer", default: 8,  maximum: 20 } },
            ],
            responses: {
                200: {
                    description: "Search results grouped by entity type",
                    content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            query:      { type: "string", description: "Original query string" },
                            products:   { type: "array", items: {
                                allOf: [
                                    { $ref: "#/components/schemas/Product" },
                                    { type: "object", properties: { rank: { type: "number", description: "FTS relevance score" } } },
                                ],
                            }},
                            categories: { type: "array", items: {
                                allOf: [
                                    { $ref: "#/components/schemas/Category" },
                                    { type: "object", properties: { rank: { type: "number" } } },
                                ],
                            }},
                            shops: { type: "array", items: {
                                allOf: [
                                    { $ref: "#/components/schemas/Shop" },
                                    { type: "object", properties: { rank: { type: "number" } } },
                                ],
                            }},
                        },
                    }}},
                },
            },
        },
    },

    // ── Catalog — Categories ──────────────────────────────────────────────────────

    "/buyer/catalog/categories": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "List active categories (flat)",
            parameters: paginationParams,
            responses: {
                200: {
                    description: "Active categories",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/Category" } },
                    } } } },
                },
            },
        },
    },

    "/buyer/catalog/categories/tree": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "Category tree (root nodes with nested children)",
            responses: {
                200: {
                    description: "Category tree",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/Category" } },
                    } } } },
                },
            },
        },
    },

    "/buyer/catalog/categories/{id}": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "Get a single active category with its children",
            parameters: [idParam],
            responses: {
                200: { description: "Category", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Category" } } } } } },
                404: { description: "Not found" },
            },
        },
    },

    // ── Catalog — Collections ─────────────────────────────────────────────────────

    "/buyer/catalog/collections": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "List active collections",
            parameters: paginationParams,
            responses: {
                200: {
                    description: "Active collections",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Collection" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
    },

    "/buyer/catalog/collections/{id}": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "Get a single active collection",
            parameters: [idParam],
            responses: {
                200: { description: "Collection", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Collection" } } } } } },
                404: { description: "Not found" },
            },
        },
    },

    // ── Catalog — Shops ───────────────────────────────────────────────────────────

    "/buyer/catalog/shops": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "List active shops",
            parameters: [
                ...paginationParams,
                { in: "query", name: "text",    schema: { type: "string" }, description: "Search by name" },
                { in: "query", name: "type_id", schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Active shops",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Shop" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
    },

    "/buyer/catalog/shops/{id}": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "Get a single active shop",
            parameters: [idParam],
            responses: {
                200: { description: "Shop", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } },
                404: { description: "Not found" },
            },
        },
    },

    "/buyer/catalog/shops/{id}/products": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "List active products for a shop",
            parameters: [
                idParam,
                ...paginationParams,
                { in: "query", name: "text",        schema: { type: "string" }, description: "Search by name" },
                { in: "query", name: "category_id", schema: { type: "integer" } },
                productSortParam,
            ],
            responses: {
                200: {
                    description: "Products",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Product" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
    },

    // ── Catalog — Products ────────────────────────────────────────────────────────

    "/buyer/catalog/products": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "Search / list active products",
            parameters: [
                ...paginationParams,
                { in: "query", name: "text",        schema: { type: "string" }, description: "Search by name (TK/RU)" },
                { in: "query", name: "category_id", schema: { type: "integer" } },
                { in: "query", name: "shop_id",     schema: { type: "integer" } },
                { in: "query", name: "min_price",   schema: { type: "number" }, description: "Minimum price filter (inclusive)" },
                { in: "query", name: "max_price",   schema: { type: "number" }, description: "Maximum price filter (inclusive)" },
                productSortParam,
            ],
            responses: {
                200: {
                    description: "Products",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Product" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
    },

    "/buyer/catalog/products/{id}": {
        get: {
            tags: ["Buyer — Catalog"],
            summary: "Get a single active product (includes variants + media)",
            parameters: [idParam],
            responses: {
                200: { description: "Product", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Product" } } } } } },
                404: { description: "Not found" },
            },
        },
    },

    // ── Discounts — coupon validation ─────────────────────────────────────────────

    "/buyer/discounts/validate": {
        post: {
            tags: ["Buyer — Discounts"],
            summary: "Validate a coupon code",
            description: "Public endpoint — no auth required. Returns the discount object if valid.",
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["code"], properties: {
                    code:    { type: "string", example: "SUMMER20" },
                    shop_id: { type: "integer", description: "Optional — validates shop scope" },
                } } } },
            },
            responses: {
                200: { description: "Valid discount", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Discount" } } } } } },
                404: { description: "Code not found or inactive" },
                405: { description: "Code not yet started or expired" },
            },
        },
    },

    // ── Cart ──────────────────────────────────────────────────────────────────────

    "/buyer/cart": {
        get: {
            tags: ["Buyer — Cart"],
            summary: "Get current user's cart items",
            security,
            responses: {
                200: {
                    description: "Cart items",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/CartItemRequest" } },
                    } } } },
                },
                401: { description: "Unauthorized" },
            },
        },
        put: {
            tags: ["Buyer — Cart"],
            summary: "Add or update a cart item (upsert by product + variant)",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["product_id"], properties: {
                    product_id: { type: "integer" },
                    variant_id: { type: "integer", nullable: true },
                    quantity:   { type: "integer", default: 1 },
                } } } },
            },
            responses: {
                200: { description: "Updated cart item" },
                400: { description: "product_id required" },
                401: { description: "Unauthorized" },
            },
        },
        delete: {
            tags: ["Buyer — Cart"],
            summary: "Clear all cart items",
            security,
            responses: {
                200: { description: "Cart cleared" },
                401: { description: "Unauthorized" },
            },
        },
    },

    "/buyer/cart/{itemId}": {
        delete: {
            tags: ["Buyer — Cart"],
            summary: "Remove a single cart item",
            security,
            parameters: [{ in: "path", name: "itemId", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Item removed" },
                401: { description: "Unauthorized" },
            },
        },
    },

    // ── Orders ────────────────────────────────────────────────────────────────────

    "/buyer/orders": {
        get: {
            tags: ["Buyer — Orders"],
            summary: "List own orders",
            security,
            parameters: [
                ...paginationParams,
                { in: "query", name: "status",  schema: { type: "integer" } },
                { in: "query", name: "shop_id", schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Orders",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Order" } },
                        count: { type: "integer" },
                    } } } },
                },
                401: { description: "Unauthorized" },
            },
        },
        post: {
            tags: ["Buyer — Orders"],
            summary: "Place a new order",
            description: "Prices are resolved server-side from the DB to prevent tampering.",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/OrderRequest" } } },
            },
            responses: {
                201: { description: "Order created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Order" } } } } } },
                400: { description: "Validation error" },
                401: { description: "Unauthorized" },
            },
        },
    },

    "/buyer/orders/{id}": {
        get: {
            tags: ["Buyer — Orders"],
            summary: "Get a single own order (full detail)",
            security,
            parameters: [idParam],
            responses: {
                200: { description: "Order", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Order" } } } } } },
                404: { description: "Not found or not owned by caller" },
            },
        },
    },

    "/buyer/orders/{id}/cancel": {
        post: {
            tags: ["Buyer — Orders"],
            summary: "Cancel an order (only status 0 or 1)",
            security,
            parameters: [idParam],
            requestBody: {
                content: { "application/json": { schema: { type: "object", properties: {
                    note: { type: "string" },
                } } } },
            },
            responses: {
                200: { description: "Order cancelled" },
                405: { description: "Order cannot be cancelled (already past status 1)" },
                404: { description: "Not found" },
            },
        },
    },

    // ── Delivery Addresses ────────────────────────────────────────────────────────

    "/buyer/addresses": {
        get: {
            tags: ["Buyer — Addresses"],
            summary: "List own delivery addresses",
            security,
            responses: {
                200: {
                    description: "Addresses",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/DeliveryAddress" } },
                    } } } },
                },
                401: { description: "Unauthorized" },
            },
        },
        post: {
            tags: ["Buyer — Addresses"],
            summary: "Create a delivery address",
            description: "If `is_default: true`, all other addresses for the user are unset.",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryAddressRequest" } } },
            },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/DeliveryAddress" } } } } } },
                401: { description: "Unauthorized" },
            },
        },
    },

    "/buyer/addresses/{id}": {
        get: {
            tags: ["Buyer — Addresses"],
            summary: "Get a single own address",
            security,
            parameters: [idParam],
            responses: {
                200: { description: "Address" },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: ["Buyer — Addresses"],
            summary: "Update a delivery address",
            security,
            parameters: [idParam],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryAddressRequest" } } },
            },
            responses: {
                200: { description: "Updated address" },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: ["Buyer — Addresses"],
            summary: "Delete a delivery address",
            security,
            parameters: [idParam],
            responses: {
                200: { description: "Deleted" },
                404: { description: "Not found" },
            },
        },
    },

    // ── Reviews ───────────────────────────────────────────────────────────────────

    "/buyer/reviews": {
        get: {
            tags: ["Buyer — Reviews"],
            summary: "List own reviews",
            security,
            parameters: [
                ...paginationParams,
                { in: "query", name: "product_id", schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Reviews",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Review" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
        post: {
            tags: ["Buyer — Reviews"],
            summary: "Submit a product review (one per product per order)",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewRequest" } } },
            },
            responses: {
                201: { description: "Review created" },
                400: { description: "Already reviewed or validation error" },
            },
        },
    },

    "/buyer/reviews/{id}": {
        delete: {
            tags: ["Buyer — Reviews"],
            summary: "Delete own review",
            security,
            parameters: [idParam],
            responses: {
                200: { description: "Deleted" },
                404: { description: "Not found or not owned by caller" },
            },
        },
    },

    // ── AI Recommendations (public) ───────────────────────────────────────────────

    "/buyer/ai/recommendations": {
        get: {
            tags: ["Buyer — AI"],
            summary: "Get active AI agent suggestion cards",
            description: "Public — no auth required. Returns cards ordered by `sort_order` ASC. Used to populate the AI Agent screen on the mobile app.",
            responses: {
                200: {
                    description: "Active AI recommendations",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/AiRecommendation" } },
                    } } } },
                },
            },
        },
    },

    // ── Coins ─────────────────────────────────────────────────────────────────────

    "/buyer/coins/balance": {
        get: {
            tags: ["Buyer — Coins"],
            summary: "Get own coin balance",
            security,
            responses: {
                200: {
                    description: "Coin wallet",
                    content: { "application/json": { schema: { type: "object", properties: {
                        balance:      { type: "integer", example: 350 },
                        total_earned: { type: "integer", example: 500 },
                        total_spent:  { type: "integer", example: 150 },
                    } } } },
                },
                401: { description: "Unauthorized" },
            },
        },
    },

    "/buyer/coins/history": {
        get: {
            tags: ["Buyer — Coins"],
            summary: "Get own coin transaction history",
            security,
            parameters: [
                ...paginationParams,
            ],
            responses: {
                200: {
                    description: "Transaction log",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: {
                            type: "array",
                            items: { type: "object", properties: {
                                id:           { type: "integer" },
                                amount:       { type: "integer", description: "Positive = credit, negative = debit" },
                                type:         { type: "string", enum: ["EARN", "SPEND", "WITHDRAW", "REFUND", "GRANT", "DEDUCT"] },
                                source:       { type: "string", enum: ["ORDER", "REVIEW", "REFERRAL", "TASK", "AI", "GIFT", "MANUAL"] },
                                reference_id: { type: "string", nullable: true },
                                balance_after:{ type: "integer" },
                                note:         { type: "string", nullable: true },
                                createdAt:    { type: "string", format: "date-time" },
                            } },
                        },
                        count: { type: "integer" },
                    } } } },
                },
                401: { description: "Unauthorized" },
            },
        },
    },

    "/buyer/coins/topup": {
        post: {
            tags: ["Buyer — Coins"],
            summary: "Submit a coin top-up request",
            description: "Buyer submits payment receipt; admin reviews and approves. Coins are credited only on approval.",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["amount_tmt"], properties: {
                    amount_tmt:  { type: "number", example: 10.00, description: "TMT amount paid (1 TMT = 100 coins)" },
                    receipt_url: { type: "string",  nullable: true, description: "URL of the payment receipt" },
                } } } },
            },
            responses: {
                201: {
                    description: "Top-up request created (status: PENDING)",
                    content: { "application/json": { schema: { type: "object", properties: {
                        id:              { type: "integer" },
                        amount_tmt:      { type: "number" },
                        coins_requested: { type: "integer" },
                        status:          { type: "string", example: "PENDING" },
                    } } } },
                },
                400: { description: "amount_tmt required or too small" },
                401: { description: "Unauthorized" },
            },
        },
        get: {
            tags: ["Buyer — Coins"],
            summary: "List own top-up requests",
            security,
            parameters: paginationParams,
            responses: {
                200: {
                    description: "Top-up requests",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: {
                            type: "array",
                            items: { type: "object", properties: {
                                id:              { type: "integer" },
                                amount_tmt:      { type: "number" },
                                coins_requested: { type: "integer" },
                                status:          { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                                receipt_url:     { type: "string", nullable: true },
                                note:            { type: "string", nullable: true },
                                createdAt:       { type: "string", format: "date-time" },
                            } },
                        },
                        count: { type: "integer" },
                    } } } },
                },
                401: { description: "Unauthorized" },
            },
        },
    },
};
