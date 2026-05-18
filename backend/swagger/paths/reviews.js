const tag = "Reviews";
const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/reviews": {
        get: {
            tags: [tag],
            summary: "List reviews",
            security,
            parameters: [
                { in: "query", name: "product_id", schema: { type: "integer" } },
                { in: "query", name: "user_id", schema: { type: "string", format: "uuid" } },
                { in: "query", name: "status", schema: { type: "integer" }, description: "0=pending, 1=approved, 2=rejected" },
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip", schema: { type: "integer" } },
            ],
            responses: {
                200: { description: "Paginated review list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Review" } }, count: { type: "integer" } } } } } },
            },
        },
        post: {
            tags: [tag],
            summary: "Submit a review (auto-updates product rating aggregate)",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewRequest" } } } },
            responses: {
                201: { description: "Review created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Review" } } } } } },
                400: { description: "Already reviewed or validation error" },
            },
        },
    },
    "/admin/reviews/{id}": {
        get: {
            tags: [tag],
            summary: "Get review by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Review" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete review",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/reviews/{id}/status": {
        patch: {
            tags: [tag],
            summary: "Moderate review (approve / reject)",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["status"],
                            properties: { status: { type: "integer", description: "1=approved, 2=rejected" } },
                        },
                    },
                },
            },
            responses: { 200: { description: "Status updated" } },
        },
    },
    "/admin/reviews/{id}/force": {
        delete: {
            tags: [tag],
            summary: "Permanently delete review",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted permanently" } },
        },
    },
    "/admin/reviews/{id}/reply": {
        get: {
            tags: [tag],
            summary: "Get seller reply to review",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Reply text or null" } },
        },
        post: {
            tags: [tag],
            summary: "Create or update seller reply",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["reply"], properties: { reply: { type: "string" } } } } },
            },
            responses: { 200: { description: "Reply saved" } },
        },
        delete: {
            tags: [tag],
            summary: "Delete seller reply",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Reply deleted" } },
        },
    },
};
