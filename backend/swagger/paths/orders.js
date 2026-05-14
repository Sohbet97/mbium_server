const tagCart = "Cart";
const tagOrders = "Orders";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Cart ─────────────────────────────────────────────────────────────────────
    "/admin/cart": {
        get: {
            tags: [tagCart],
            summary: "Get current user's cart",
            security,
            responses: { 200: { description: "Cart items with product details" } },
        },
        post: {
            tags: [tagCart],
            summary: "Add or update cart item (upsert by product + variant)",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CartItemRequest" } } } },
            responses: { 200: { description: "Cart item upserted" }, 400: { description: "Validation error" } },
        },
        delete: {
            tags: [tagCart],
            summary: "Clear entire cart",
            security,
            responses: { 200: { description: "Cart cleared" } },
        },
    },
    "/admin/cart/{id}": {
        delete: {
            tags: [tagCart],
            summary: "Remove a single cart item",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Item removed" } },
        },
    },

    // ── Orders ───────────────────────────────────────────────────────────────────
    "/admin/orders": {
        get: {
            tags: [tagOrders],
            summary: "List orders (admins see all; customers see their own)",
            security,
            parameters: [
                { in: "query", name: "shop_id", schema: { type: "integer" } },
                { in: "query", name: "status", schema: { type: "integer" } },
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip", schema: { type: "integer" } },
            ],
            responses: {
                200: { description: "Paginated order list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Order" } }, count: { type: "integer" } } } } } },
            },
        },
        post: {
            tags: [tagOrders],
            summary: "Place a new order (prices resolved server-side)",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OrderRequest" } } } },
            responses: {
                201: { description: "Order created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Order" } } } } } },
                400: { description: "Validation error or product not found" },
            },
        },
    },
    "/admin/orders/{id}": {
        get: {
            tags: [tagOrders],
            summary: "Get order by ID (includes items, history, payments)",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Full order detail" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tagOrders],
            summary: "Soft-delete order",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/orders/{id}/status": {
        patch: {
            tags: [tagOrders],
            summary: "Update order status (appends to history)",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["status"],
                            properties: {
                                status: { type: "integer", description: "0=pending,1=confirmed,2=processing,3=shipped,4=delivered,10=cancelled" },
                                note: { type: "string" },
                            },
                        },
                    },
                },
            },
            responses: { 200: { description: "Status updated" }, 404: { description: "Not found" } },
        },
    },
    "/admin/orders/{id}/payments": {
        post: {
            tags: [tagOrders],
            summary: "Log a payment transaction for an order",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["amount", "method"],
                            properties: {
                                amount: { type: "number" },
                                currency: { type: "string", default: "TMT" },
                                method: { type: "string", enum: ["CASH", "CARD", "BANK_TRANSFER"] },
                                external_id: { type: "string" },
                                paid_at: { type: "string", format: "date-time" },
                            },
                        },
                    },
                },
            },
            responses: { 201: { description: "Payment logged" } },
        },
    },
    "/admin/orders/{id}/force": {
        delete: {
            tags: [tagOrders],
            summary: "Permanently delete order",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted permanently" } },
        },
    },
};
