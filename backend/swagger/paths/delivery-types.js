const tag = "DeliveryTypes";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Admin — Delivery Types ───────────────────────────────────────────────
    "/admin/delivery-types": {
        get: {
            tags: [tag],
            summary: "List delivery types (paginated)",
            security,
            parameters: [
                { in: "query", name: "is_active", schema: { type: "boolean" } },
                { in: "query", name: "limit",      schema: { type: "integer", default: 50 } },
                { in: "query", name: "skip",       schema: { type: "integer", default: 0 } },
            ],
            responses: {
                200: {
                    description: "Paginated delivery type list",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/DeliveryType" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
        post: {
            tags: [tag],
            summary: "Create delivery type",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryTypeRequest" } } },
            },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/DeliveryType" } } } } } },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/delivery-types/{id}": {
        get: {
            tags: [tag],
            summary: "Get delivery type by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Delivery type", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/DeliveryType" } } } } } },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: [tag],
            summary: "Update delivery type",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryTypeRequest" } } },
            },
            responses: {
                200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/DeliveryType" } } } } } },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: [tag],
            summary: "Delete delivery type",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Deleted" },
                404: { description: "Not found" },
            },
        },
    },

    // ── Seller — Delivery Types (read-only picker) ───────────────────────────
    "/seller/delivery-types": {
        get: {
            tags: [tag],
            summary: "List active delivery types (for the product/shop delivery-type picker)",
            security,
            responses: {
                200: {
                    description: "Active delivery types",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/DeliveryType" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
    },
    "/seller/shop/delivery-types": {
        put: {
            tags: [tag],
            summary: "Set the seller's shop delivery types (full replace)",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    delivery_type_ids: { type: "array", items: { type: "integer" } },
                }}}},
            },
            responses: {
                200: { description: "Updated shop", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } },
            },
        },
    },
};
