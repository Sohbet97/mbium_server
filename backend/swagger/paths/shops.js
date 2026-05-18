const tag = "Shops";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Shops ─────────────────────────────────────────────────────────────────
    "/admin/shops": {
        get: {
            tags: [tag],
            summary: "List shops",
            security,
            parameters: [
                { in: "query", name: "text",     schema: { type: "string" } },
                { in: "query", name: "is_active", schema: { type: "boolean" } },
                { in: "query", name: "limit",    schema: { type: "integer" } },
                { in: "query", name: "skip",     schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Paginated shop list",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Shop" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
        post: {
            tags: [tag],
            summary: "Create shop (admin)",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopRequest" } } } },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/shops/{id}": {
        get: {
            tags: [tag],
            summary: "Get shop by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Shop", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: [tag],
            summary: "Update shop",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopRequest" } } } },
            responses: { 200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete shop",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
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
    "/admin/shops/{id}/restore": {
        patch: {
            tags: [tag],
            summary: "Restore soft-deleted shop",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Restored" } },
        },
    },
    "/admin/shops/{id}/submit-for-review": {
        patch: {
            tags: [tag],
            summary: "Submit shop for moderation review",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Status set to pending (1)", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } },
                404: { description: "Not found" },
            },
        },
    },
    "/admin/shops/{id}/verify": {
        patch: {
            tags: [tag],
            summary: "Verify (approve) shop application",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Shop verified, is_active set to true", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } },
                404: { description: "Not found" },
            },
        },
    },
    "/admin/shops/{id}/reject": {
        patch: {
            tags: [tag],
            summary: "Reject shop application",
            description: "Sets verification_status to 3 (rejected) and sends a Socket.IO notification to the shop owner.",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: false,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: { note: { type: "string", description: "Rejection reason shown to the owner" } },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Rejected, owner notified", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } },
                404: { description: "Not found" },
            },
        },
    },

    // ── Shop Types ───────────────────────────────────────────────────────────
    "/admin/shop-types": {
        get: {
            tags: [tag],
            summary: "List shop types",
            security,
            responses: {
                200: { description: "Shop type list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/ShopType" } } } } } } },
            },
        },
        post: {
            tags: [tag],
            summary: "Create shop type",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopTypeRequest" } } } },
            responses: { 201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/ShopType" } } } } } } },
        },
    },
    "/admin/shop-types/{id}": {
        put: {
            tags: [tag],
            summary: "Update shop type",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopTypeRequest" } } } },
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

    // ── Shop Members ─────────────────────────────────────────────────────────
    "/admin/shop-members": {
        get: {
            tags: [tag],
            summary: "List shop members",
            security,
            parameters: [
                { in: "query", name: "shop_id", schema: { type: "integer" } },
                { in: "query", name: "limit",   schema: { type: "integer" } },
                { in: "query", name: "skip",    schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Paginated list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/ShopMember" } }, count: { type: "integer" } } } } } } },
        },
        post: {
            tags: [tag],
            summary: "Invite member to shop",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopMemberRequest" } } } },
            responses: { 201: { description: "Member added" }, 400: { description: "Validation error" } },
        },
    },
    "/admin/shop-members/{id}": {
        get: {
            tags: [tag],
            summary: "Get shop member by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Member", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/ShopMember" } } } } } }, 404: { description: "Not found" } },
        },
        put: {
            tags: [tag],
            summary: "Update member role or status",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopMemberRequest" } } } },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete member",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/shop-members/{id}/force": {
        delete: { tags: [tag], summary: "Permanently delete member", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Deleted permanently" } } },
    },
    "/admin/shop-members/{id}/restore": {
        post: { tags: [tag], summary: "Restore member", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Restored" } } },
    },

    // ── Shop Application (self-service) ──────────────────────────────────────
    "/auth/me/shop": {
        get: {
            tags: [tag],
            summary: "Get own shop status",
            description: "Returns the authenticated user's shop with verification_status, type (incl. commission_rate), and categories.",
            security,
            responses: {
                200: { description: "Shop or null", content: { "application/json": { schema: { type: "object", properties: { model: { oneOf: [{ $ref: "#/components/schemas/Shop" }, { type: "null" }] } } } } } },
            },
        },
        post: {
            tags: [tag],
            summary: "Apply to open a shop",
            description: "Creates the shop and immediately submits it for review (verification_status → 1). Returns 400 if the user already owns a shop.",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ShopRequest" } } } },
            responses: {
                201: { description: "Application submitted", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } },
                400: { description: "Validation error or shop already exists" },
            },
        },
    },
};
