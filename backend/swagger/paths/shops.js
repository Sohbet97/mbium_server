const tag = "Shops";
const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/shops": {
        get: {
            tags: [tag],
            summary: "List shops",
            security,
            parameters: [
                { in: "query", name: "text", schema: { type: "string" } },
                { in: "query", name: "is_active", schema: { type: "boolean" } },
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip", schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Paginated shop list",
                    content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Shop" } }, count: { type: "integer" } } } } },
                },
            },
        },
        post: {
            tags: [tag],
            summary: "Create shop",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopRequest" } } } },
            responses: { 201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } }, 400: { description: "Validation error" } },
        },
    },
    "/admin/shops/{id}": {
        get: {
            tags: [tag],
            summary: "Get shop by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Shop", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } }, 404: { description: "Not found" } },
        },
        put: {
            tags: [tag],
            summary: "Update shop",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopRequest" } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete shop",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/shops/{id}/restore": {
        patch: {
            tags: [tag],
            summary: "Restore soft-deleted shop",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Restored" } },
        },
    },
    "/admin/shops/{id}/force": {
        delete: {
            tags: [tag],
            summary: "Permanently delete shop",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted permanently" } },
        },
    },
    "/admin/shop-types": {
        get: {
            tags: [tag],
            summary: "List shop types",
            security,
            responses: {
                200: { description: "Shop type list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/ShopType" } } } } } } },
            },
            post: {
                tags: [tag],
                summary: "Create shop type",
                security,
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopType" } } } },
                responses: { 201: { description: "Created" } },
            },
        },
        "/admin/shop-types/{id}": {
            put: {
                tags: [tag],
                summary: "Update shop type",
                security,
                parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopType" } } } },
                responses: { 200: { description: "Updated" } },
            },
            delete: {
                tags: [tag],
                summary: "Delete shop type",
                security,
                parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
                responses: { 200: { description: "Deleted" } },
            },
        },
    }
};
