const tag = "Suppliers";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Admin — Suppliers ─────────────────────────────────────────────────────
    "/admin/suppliers": {
        get: {
            tags: [tag],
            summary: "List suppliers",
            security,
            parameters: [
                { in: "query", name: "search",    schema: { type: "string" }, description: "Filter by name" },
                { in: "query", name: "is_active",  schema: { type: "boolean" } },
                { in: "query", name: "limit",      schema: { type: "integer", default: 50 } },
                { in: "query", name: "skip",       schema: { type: "integer", default: 0 } },
            ],
            responses: {
                200: {
                    description: "Paginated supplier list",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Supplier" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
        post: {
            tags: [tag],
            summary: "Create supplier",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/SupplierRequest" } } },
            },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Supplier" } } } } } },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/suppliers/{id}": {
        get: {
            tags: [tag],
            summary: "Get supplier by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Supplier", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Supplier" } } } } } },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: [tag],
            summary: "Update supplier",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/SupplierRequest" } } },
            },
            responses: {
                200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Supplier" } } } } } },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: [tag],
            summary: "Delete supplier",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Deleted" },
                404: { description: "Not found" },
            },
        },
    },
};
