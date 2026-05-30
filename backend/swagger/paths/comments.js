const adminTag  = "Comments";
const buyerTag  = "Buyer — Comments";
const security  = [{ BearerAuth: [] }];

module.exports = {
    // ── Admin — Comments moderation ───────────────────────────────────────────
    "/admin/comments": {
        get: {
            tags: [adminTag],
            summary: "List product comments (admin moderation queue)",
            security,
            parameters: [
                { in: "query", name: "status",     schema: { type: "string", enum: ["pending", "approved", "rejected"] }, description: "Filter by status" },
                { in: "query", name: "product_id", schema: { type: "integer" }, description: "Filter by product" },
                { in: "query", name: "limit",      schema: { type: "integer", default: 40 } },
                { in: "query", name: "skip",       schema: { type: "integer", default: 0 } },
            ],
            responses: {
                200: {
                    description: "Paginated comment list",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Comment" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
    },
    "/admin/comments/{id}/status": {
        patch: {
            tags: [adminTag],
            summary: "Approve or reject a comment",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["status"],
                            properties: {
                                status: { type: "string", enum: ["approved", "rejected"] },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Status updated", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Comment" } } } } } },
                404: { description: "Not found" },
            },
        },
    },
    "/admin/comments/{id}": {
        delete: {
            tags: [adminTag],
            summary: "Delete comment",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Deleted" },
                404: { description: "Not found" },
            },
        },
    },

    // ── Buyer — Comments ──────────────────────────────────────────────────────
    "/buyer/catalog/products/{productId}/comments": {
        get: {
            tags: [buyerTag],
            summary: "Get approved comments for a product (public)",
            parameters: [
                { in: "path", name: "productId", required: true, schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Approved top-level comments with nested replies",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/Comment" } },
                    }}}},
                },
            },
        },
        post: {
            tags: [buyerTag],
            summary: "Post a comment on a product (requires auth)",
            security,
            parameters: [
                { in: "path", name: "productId", required: true, schema: { type: "integer" } },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["body"],
                            properties: {
                                body:      { type: "string", example: "Great product!" },
                                parent_id: { type: "integer", nullable: true, description: "Set to reply to another comment" },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "Comment created (status=pending until moderated)", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Comment" } } } } } },
                400: { description: "Body is required" },
            },
        },
    },
};
