const tag = "Coins";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Admin — Balances ──────────────────────────────────────────────────────
    "/admin/coins/balances": {
        get: {
            tags: [tag],
            summary: "List all users' coin balances (paginated)",
            security,
            parameters: [
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip",  schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Balances",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { type: "object" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
    },
    "/admin/coins/balances/{userId}": {
        get: {
            tags: [tag],
            summary: "Get a single user's coin balance + recent history",
            security,
            parameters: [{ in: "path", name: "userId", required: true, schema: { type: "string", format: "uuid" } }],
            responses: { 200: { description: "Balance and history (last 50)" } },
        },
    },

    // ── Admin — Grant / Deduct ────────────────────────────────────────────────
    "/admin/coins/grant": {
        post: {
            tags: [tag],
            summary: "Grant coins to one or more users",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["user_ids", "amount"], properties: {
                    user_ids: { type: "array", items: { type: "string", format: "uuid" } },
                    amount:   { type: "number" },
                    note:     { type: "string", nullable: true },
                } } } },
            },
            responses: { 200: { description: "Granted" } },
        },
    },
    "/admin/coins/deduct": {
        post: {
            tags: [tag],
            summary: "Deduct coins from a user",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["user_id", "amount"], properties: {
                    user_id: { type: "string", format: "uuid" },
                    amount:  { type: "number" },
                    note:    { type: "string", nullable: true },
                } } } },
            },
            responses: { 200: { description: "Deducted" } },
        },
    },

    // ── Admin — Earning Conditions ────────────────────────────────────────────
    "/admin/coins/conditions": {
        get: {
            tags: [tag],
            summary: "List coin-earning conditions",
            security,
            responses: { 200: { description: "Conditions", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { type: "object" } } } } } } } },
        },
        post: {
            tags: [tag],
            summary: "Create earning condition",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
            responses: { 201: { description: "Created" } },
        },
    },
    "/admin/coins/conditions/{id}": {
        put: {
            tags: [tag],
            summary: "Update earning condition",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: [tag],
            summary: "Delete earning condition",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },

    // ── Admin — Top-up Requests ───────────────────────────────────────────────
    "/admin/coins/topups": {
        get: {
            tags: [tag],
            summary: "List coin top-up requests",
            security,
            parameters: [
                { in: "query", name: "status", schema: { type: "string" } },
                { in: "query", name: "limit",  schema: { type: "integer" } },
                { in: "query", name: "skip",   schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Top-up requests",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { type: "object" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
    },
    "/admin/coins/topups/{id}/status": {
        patch: {
            tags: [tag],
            summary: "Approve or reject a top-up request",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["status"], properties: {
                    status: { type: "string", enum: ["APPROVED", "REJECTED"] },
                    note:   { type: "string", nullable: true },
                } } } },
            },
            responses: { 200: { description: "Updated top-up request" } },
        },
    },
    // Note: buyer-facing /buyer/coins/balance, /history, /topup are documented in paths/buyer.js.
};
