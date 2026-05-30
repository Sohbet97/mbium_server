const tag = "Brands";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Admin — Brands ────────────────────────────────────────────────────────
    "/admin/brands": {
        get: {
            tags: [tag],
            summary: "List brands (flat, paginated)",
            security,
            parameters: [
                { in: "query", name: "search",    schema: { type: "string" }, description: "Filter by name" },
                { in: "query", name: "is_active",  schema: { type: "boolean" } },
                { in: "query", name: "limit",      schema: { type: "integer", default: 50 } },
                { in: "query", name: "skip",       schema: { type: "integer", default: 0 } },
            ],
            responses: {
                200: {
                    description: "Paginated brand list",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Brand" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
        post: {
            tags: [tag],
            summary: "Create brand",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/BrandRequest" } } },
            },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Brand" } } } } } },
                400: { description: "Validation error / slug already taken" },
            },
        },
    },
    "/admin/brands/tree": {
        get: {
            tags: [tag],
            summary: "Brand tree (nested children)",
            security,
            responses: {
                200: {
                    description: "Nested brand tree — root brands with `children` arrays",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/BrandTree" } },
                    }}}},
                },
            },
        },
    },
    "/admin/brands/{id}": {
        get: {
            tags: [tag],
            summary: "Get brand by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Brand", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Brand" } } } } } },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: [tag],
            summary: "Update brand",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/BrandRequest" } } },
            },
            responses: {
                200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Brand" } } } } } },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: [tag],
            summary: "Delete brand",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Deleted" },
                404: { description: "Not found" },
            },
        },
    },
};
