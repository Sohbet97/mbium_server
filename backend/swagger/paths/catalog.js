const tag = "Catalog";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Categories ────────────────────────────────────────────────────────────────
    "/admin/categories": {
        get: {
            tags: [tag],
            summary: "List categories",
            security,
            parameters: [
                { in: "query", name: "text", schema: { type: "string" } },
                { in: "query", name: "status", schema: { type: "integer" } },
                { in: "query", name: "parent_id", schema: { type: "integer" }, description: "Pass 'null' for root categories" },
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip", schema: { type: "integer" } },
            ],
            responses: {
                200: { description: "Paginated category list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Category" } }, count: { type: "integer" } } } } } },
            },
        },
        post: {
            tags: [tag],
            summary: "Create category",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryRequest" } } } },
            responses: { 201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Category" } } } } } }, 400: { description: "Validation error" } },
        },
    },
    "/admin/categories/tree": {
        get: {
            tags: [tag],
            summary: "Get nested category tree (active only)",
            security,
            responses: { 200: { description: "Category tree with children" } },
        },
    },
    "/admin/categories/{id}": {
        get: {
            tags: [tag],
            summary: "Get category by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Category with parent + children" }, 404: { description: "Not found" } },
        },
        put: {
            tags: [tag],
            summary: "Update category",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryRequest" } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete category",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/categories/{id}/restore": {
        patch: {
            tags: [tag],
            summary: "Restore soft-deleted category",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Restored" } },
        },
    },
    "/admin/categories/{id}/force": {
        delete: {
            tags: [tag],
            summary: "Permanently delete category",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted permanently" } },
        },
    },

    // ── Products ─────────────────────────────────────────────────────────────────
    "/admin/products": {
        get: {
            tags: [tag],
            summary: "List products",
            security,
            parameters: [
                { in: "query", name: "text", schema: { type: "string" }, description: "Search name/SKU" },
                { in: "query", name: "category_id", schema: { type: "integer" } },
                { in: "query", name: "shop_id", schema: { type: "integer" } },
                { in: "query", name: "is_active", schema: { type: "boolean" } },
                { in: "query", name: "status", schema: { type: "integer" } },
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip", schema: { type: "integer" } },
            ],
            responses: {
                200: { description: "Paginated product list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Product" } }, count: { type: "integer" } } } } } },
            },
        },
        post: {
            tags: [tag],
            summary: "Create product",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductRequest" } } } },
            responses: { 201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Product" } } } } } }, 400: { description: "Validation error" } },
        },
    },
    "/admin/products/{id}": {
        get: {
            tags: [tag],
            summary: "Get product by ID (includes variants + images)",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Product detail" }, 404: { description: "Not found" } },
        },
        put: {
            tags: [tag],
            summary: "Update product",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductRequest" } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete product",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/products/{id}/restore": {
        patch: {
            tags: [tag],
            summary: "Restore soft-deleted product",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Restored" } },
        },
    },
    "/admin/products/{id}/force": {
        delete: {
            tags: [tag],
            summary: "Permanently delete product",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted permanently" } },
        },
    },
    "/admin/products/{id}/images": {
        post: {
            tags: [tag],
            summary: "Add image to product",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["url"],
                            properties: {
                                url: { type: "string" },
                                is_primary: { type: "boolean" },
                                order: { type: "integer" },
                            },
                        },
                    },
                },
            },
            responses: { 201: { description: "Image added", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/ProductImage" } } } } } } },
        },
    },
    "/admin/products/{id}/images/{imageId}": {
        delete: {
            tags: [tag],
            summary: "Remove product image",
            security,
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "integer" } },
                { in: "path", name: "imageId", required: true, schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Removed" } },
        },
    },
    "/admin/products/{id}/variants": {
        post: {
            tags: [tag],
            summary: "Add variant to product",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductVariant" } } } },
            responses: { 201: { description: "Variant added" } },
        },
    },
    "/admin/products/{id}/variants/{variantId}": {
        put: {
            tags: [tag],
            summary: "Update product variant",
            security,
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "integer" } },
                { in: "path", name: "variantId", required: true, schema: { type: "integer" } },
            ],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductVariant" } } } },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: [tag],
            summary: "Delete product variant",
            security,
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "integer" } },
                { in: "path", name: "variantId", required: true, schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Deleted" } },
        },
    },
};
