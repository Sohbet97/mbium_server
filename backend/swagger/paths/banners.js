const tag = "Banners";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Banner Types ──────────────────────────────────────────────────────────
    "/admin/banners/types": {
        get: {
            tags: [tag],
            summary: "List banner types",
            security,
            responses: { 200: { description: "Banner type list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/BannerType" } } } } } } } },
        },
        post: {
            tags: [tag],
            summary: "Create banner type",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BannerTypeRequest" } } } },
            responses: { 201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/BannerType" } } } } } } },
        },
    },
    "/admin/banners/types/{id}": {
        put: {
            tags: [tag],
            summary: "Update banner type",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BannerTypeRequest" } } } },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: [tag],
            summary: "Delete banner type",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },

    // ── Banners ───────────────────────────────────────────────────────────────
    "/admin/banners": {
        get: {
            tags: [tag],
            summary: "List banners",
            security,
            parameters: [
                { in: "query", name: "banner_type_id", schema: { type: "integer" }, description: "Filter by banner type" },
                { in: "query", name: "shop_id",        schema: { type: "integer" } },
                { in: "query", name: "is_active",      schema: { type: "boolean" } },
                { in: "query", name: "limit",          schema: { type: "integer" } },
                { in: "query", name: "skip",           schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Paginated banner list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Banner" } }, count: { type: "integer" } } } } } } },
        },
        post: {
            tags: [tag],
            summary: "Create banner",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BannerRequest" } } } },
            responses: { 201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Banner" } } } } } }, 400: { description: "Validation error" } },
        },
    },
    "/admin/banners/reorder": {
        post: {
            tags: [tag],
            summary: "Reorder banners (bulk update sort_order)",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["items"], properties: { items: { type: "array", items: { type: "object", properties: { id: { type: "integer" }, sort_order: { type: "integer" } } } } } } } },
            },
            responses: { 200: { description: "Reordered" } },
        },
    },
    "/admin/banners/{id}": {
        get: {
            tags: [tag],
            summary: "Get banner by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Banner", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Banner" } } } } } }, 404: { description: "Not found" } },
        },
        put: {
            tags: [tag],
            summary: "Update banner",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BannerRequest" } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete banner",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/banners/{id}/force": {
        delete: { tags: [tag], summary: "Permanently delete banner", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Deleted permanently" } } },
    },
    "/admin/banners/{id}/restore": {
        post: { tags: [tag], summary: "Restore soft-deleted banner", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Restored" } } },
    },
};
