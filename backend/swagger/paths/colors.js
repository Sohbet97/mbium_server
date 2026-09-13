const tag = "Colors";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Admin — Colors ────────────────────────────────────────────────────────
    "/admin/colors": {
        get: {
            tags: [tag],
            summary: "List colours (the palette products and variants pick from)",
            security,
            parameters: [
                { in: "query", name: "text",      schema: { type: "string" }, description: "Case-insensitive search across name, name_ru, name_eng and hex" },
                { in: "query", name: "is_active", schema: { type: "boolean" } },
                { in: "query", name: "limit",     schema: { type: "integer", default: 50 } },
                { in: "query", name: "skip",      schema: { type: "integer", default: 0 } },
            ],
            responses: {
                200: {
                    description: "Paginated colour list",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Color" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
        post: {
            tags: [tag],
            summary: "Create colour",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/ColorRequest" } } },
            },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Color" } } } } } },
                400: { description: "Invalid hex, or hex/slug already taken" },
            },
        },
    },
    "/admin/colors/{id}": {
        get: {
            tags: [tag],
            summary: "Get colour by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Colour", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Color" } } } } } },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: [tag],
            summary: "Update colour",
            description: "Changing `hex` cascades to every product and variant using it (FK is ON UPDATE CASCADE).",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/ColorRequest" } } },
            },
            responses: {
                200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Color" } } } } } },
                400: { description: "Invalid hex, or hex/slug already taken" },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: [tag],
            summary: "Delete colour",
            description: "Refused while any product or variant still references the colour.",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" } } } } } },
                400: { description: "Colour still in use" },
                404: { description: "Not found" },
            },
        },
    },
};
