const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/favorites": {
        get: {
            tags: ["Favorites"],
            summary: "List all users' favorited products (paginated)",
            security,
            parameters: [
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip",  schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Favorites, each including `user` and `product` (with primary media)",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { type: "object" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
    },
    "/buyer/favorites": {
        get: {
            tags: ["Buyer — Favorites"],
            summary: "List own favorited products (paginated)",
            security,
            parameters: [
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip",  schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Own favorites",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { type: "object" } },
                        count: { type: "integer" },
                    } } } },
                },
                401: { description: "Unauthorized" },
            },
        },
    },
    "/buyer/favorites/{productId}": {
        post: {
            tags: ["Buyer — Favorites"],
            summary: "Add a product to own favorites",
            security,
            parameters: [{ in: "path", name: "productId", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Already favorited" },
                201: { description: "Added" },
                401: { description: "Unauthorized" },
            },
        },
        delete: {
            tags: ["Buyer — Favorites"],
            summary: "Remove a product from own favorites",
            security,
            parameters: [{ in: "path", name: "productId", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Removed" },
                401: { description: "Unauthorized" },
            },
        },
    },
};
