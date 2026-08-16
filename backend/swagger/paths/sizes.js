const tag = "Sizes";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Admin — Sizes ─────────────────────────────────────────────────────────
    "/admin/sizes": {
        get: {
            tags: [tag],
            summary: "List sizes (flat, paginated)",
            security,
            parameters: [
                { in: "query", name: "is_active", schema: { type: "boolean" } },
                { in: "query", name: "limit",      schema: { type: "integer", default: 50 } },
                { in: "query", name: "skip",       schema: { type: "integer", default: 0 } },
            ],
            responses: {
                200: {
                    description: "Paginated size list",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Size" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
        post: {
            tags: [tag],
            summary: "Create size",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/SizeRequest" } } },
            },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Size" } } } } } },
                400: { description: "Validation error / slug already taken" },
            },
        },
    },
    "/admin/sizes/tree": {
        get: {
            tags: [tag],
            summary: "Size tree (nested children)",
            security,
            responses: {
                200: {
                    description: "Nested size tree — root sizes with `children` arrays",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/SizeTree" } },
                    }}}},
                },
            },
        },
    },
    "/admin/sizes/{id}": {
        get: {
            tags: [tag],
            summary: "Get size by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Size", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Size" } } } } } },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: [tag],
            summary: "Update size",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/SizeRequest" } } },
            },
            responses: {
                200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Size" } } } } } },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: [tag],
            summary: "Delete size",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Deleted" },
                404: { description: "Not found" },
            },
        },
    },

    // ── Seller — Sizes (read-only picker) ────────────────────────────────────
    "/seller/sizes": {
        get: {
            tags: [tag],
            summary: "List active sizes (flat, for the variant-size picker)",
            security,
            responses: {
                200: {
                    description: "Active sizes",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Size" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
    },
    "/seller/sizes/tree": {
        get: {
            tags: [tag],
            summary: "Size tree (nested children)",
            security,
            responses: {
                200: {
                    description: "Nested size tree — root sizes with `children` arrays",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/SizeTree" } },
                    }}}},
                },
            },
        },
    },
};
