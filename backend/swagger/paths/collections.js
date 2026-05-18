const tag = "Collections";
const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/collections/search-products": {
        get: {
            tags: [tag],
            summary: "Search products to add to a collection",
            security,
            parameters: [
                { in: "query", name: "query",         schema: { type: "string" }, description: "Name / SKU search" },
                { in: "query", name: "collection_id", schema: { type: "integer" }, description: "Exclude already-added products" },
                { in: "query", name: "limit",         schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Matching products", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Product" } } } } } } } },
        },
    },
    "/admin/collections": {
        get: {
            tags: [tag],
            summary: "List collections",
            security,
            parameters: [
                { in: "query", name: "text",      schema: { type: "string" } },
                { in: "query", name: "is_active", schema: { type: "boolean" } },
                { in: "query", name: "limit",     schema: { type: "integer" } },
                { in: "query", name: "skip",      schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Paginated list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Collection" } }, count: { type: "integer" } } } } } } },
        },
        post: {
            tags: [tag],
            summary: "Create collection",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CollectionRequest" } } } },
            responses: { 201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Collection" } } } } } } },
        },
    },
    "/admin/collections/{id}": {
        get: {
            tags: [tag],
            summary: "Get collection with products",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Collection with products", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Collection" } } } } } }, 404: { description: "Not found" } },
        },
        put: {
            tags: [tag],
            summary: "Update collection",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CollectionRequest" } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Delete collection",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/collections/{id}/products": {
        post: {
            tags: [tag],
            summary: "Add product to collection",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["product_id"], properties: { product_id: { type: "integer" }, sort_order: { type: "integer", default: 0 } } } } } },
            responses: { 201: { description: "Product added" }, 409: { description: "Already in collection" } },
        },
    },
    "/admin/collections/{id}/products/{productId}": {
        delete: {
            tags: [tag],
            summary: "Remove product from collection",
            security,
            parameters: [
                { in: "path", name: "id",        required: true, schema: { type: "integer" } },
                { in: "path", name: "productId", required: true, schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Removed" } },
        },
    },
};
