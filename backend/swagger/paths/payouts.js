const tag = "Payouts";
const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/payouts": {
        get: {
            tags: [tag],
            summary: "List payout requests",
            security,
            parameters: [
                { in: "query", name: "shop_id", schema: { type: "integer" } },
                { in: "query", name: "status",  schema: { type: "integer" }, description: "0=pending, 1=approved, 2=rejected" },
                { in: "query", name: "limit",   schema: { type: "integer" } },
                { in: "query", name: "skip",    schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Paginated list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/PayoutRequest" } }, count: { type: "integer" } } } } } } },
        },
        post: {
            tags: [tag],
            summary: "Create payout request",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PayoutRequestBody" } } } },
            responses: { 201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/PayoutRequest" } } } } } }, 400: { description: "Validation error" } },
        },
    },
    "/admin/payouts/{id}": {
        get: {
            tags: [tag],
            summary: "Get payout request by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Payout request", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/PayoutRequest" } } } } } }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete payout request",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/payouts/{id}/status": {
        patch: {
            tags: [tag],
            summary: "Approve or reject payout request",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "integer", description: "1=approved, 2=rejected" }, note: { type: "string" } } } } },
            },
            responses: { 200: { description: "Status updated" } },
        },
    },
    "/admin/payouts/{id}/force": {
        delete: { tags: [tag], summary: "Permanently delete", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Deleted permanently" } } },
    },
    "/admin/payouts/{id}/restore": {
        post: { tags: [tag], summary: "Restore soft-deleted payout request", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Restored" } } },
    },

    // ── Seller Balance ────────────────────────────────────────────────────────
    "/admin/seller-balance": {
        get: {
            tags: [tag],
            summary: "List all seller balances",
            security,
            responses: { 200: { description: "Balance list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/SellerBalance" } } } } } } } },
        },
    },
    "/seller/balance/debit": {
        post: {
            tags: [tag],
            summary: "Debit the shop balance (called by the Live project)",
            description:
                "Charges the authenticated seller's own shop (`available_balance`). " +
                "Idempotent per `reference_id`: a repeated request returns the first result and does not debit again " +
                "(a different `amount` with a used `reference_id` returns 409). " +
                "Insufficient balance returns 400 and the balance is unchanged (never negative). " +
                "Every debit is recorded in the shop's transaction history as `EXTERNAL_DEBIT`.",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: {
                    type: "object",
                    required: ["amount", "reason", "reference_id"],
                    properties: {
                        amount:       { type: "number", example: 50, description: "Positive amount" },
                        reason:       { type: "string", example: "live", maxLength: 50 },
                        reference_id: { type: "string", example: "live-8f3a2c", maxLength: 100 },
                    },
                }}},
            },
            responses: {
                200: { description: "Debited (or the original result of a repeated request)", content: { "application/json": { schema: { type: "object", properties: { balance: { type: "number", example: 450 }, transaction_id: { type: "integer", example: 10231 } } } } } },
                400: { description: "Validation error or insufficient balance" },
                409: { description: "reference_id already used with a different amount" },
            },
        },
    },
    "/admin/seller-balance/{shopId}": {
        get: {
            tags: [tag],
            summary: "Get balance for a specific shop",
            security,
            parameters: [{ in: "path", name: "shopId", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Balance", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/SellerBalance" } } } } } }, 404: { description: "Not found" } },
        },
    },
};
