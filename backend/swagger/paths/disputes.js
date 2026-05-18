const tag = "Disputes";
const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/disputes": {
        get: {
            tags: [tag],
            summary: "List disputes",
            security,
            parameters: [
                { in: "query", name: "order_id", schema: { type: "integer" } },
                { in: "query", name: "status",   schema: { type: "integer" } },
                { in: "query", name: "limit",    schema: { type: "integer" } },
                { in: "query", name: "skip",     schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Paginated list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Dispute" } }, count: { type: "integer" } } } } } } },
        },
        post: {
            tags: [tag],
            summary: "Open a dispute",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DisputeRequest" } } } },
            responses: { 201: { description: "Dispute opened", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Dispute" } } } } } }, 400: { description: "Validation error" } },
        },
    },
    "/admin/disputes/{id}": {
        get: {
            tags: [tag],
            summary: "Get dispute by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Dispute", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Dispute" } } } } } }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete dispute",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/disputes/{id}/status": {
        patch: {
            tags: [tag],
            summary: "Update dispute status",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "integer" }, note: { type: "string" } } } } },
            },
            responses: { 200: { description: "Status updated" } },
        },
    },
    "/admin/disputes/{id}/force": {
        delete: { tags: [tag], summary: "Permanently delete dispute", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Deleted permanently" } } },
    },
    "/admin/disputes/{id}/restore": {
        post: { tags: [tag], summary: "Restore dispute", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Restored" } } },
    },
};
