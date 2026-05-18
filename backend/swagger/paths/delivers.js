const tag = "Delivers";
const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/delivers": {
        get: {
            tags: [tag],
            summary: "List delivery drivers",
            security,
            parameters: [
                { in: "query", name: "text",    schema: { type: "string" }, description: "Search by first or last name" },
                { in: "query", name: "city_id", schema: { type: "integer" } },
                { in: "query", name: "status",  schema: { type: "integer", enum: [0, 1] }, description: "0=offline, 1=online" },
                { in: "query", name: "limit",   schema: { type: "integer" } },
                { in: "query", name: "skip",    schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Paginated driver list",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Deliver" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
        post: {
            tags: [tag],
            summary: "Create delivery driver",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DeliverRequest" } } } },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Deliver" } } } } } },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/delivers/{id}": {
        get: {
            tags: [tag],
            summary: "Get driver by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Driver", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Deliver" } } } } } },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: [tag],
            summary: "Update driver",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DeliverRequest" } } } },
            responses: {
                200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Deliver" } } } } } },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete driver",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/delivers/{id}/force": {
        delete: {
            tags: [tag],
            summary: "Permanently delete driver",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted permanently" } },
        },
    },
};
