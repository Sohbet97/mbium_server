const tag = "Users";
const security = [{ BearerAuth: [] }];

const paginationParams = [
    { in: "query", name: "limit", schema: { type: "integer" } },
    { in: "query", name: "skip", schema: { type: "integer" } },
    { in: "query", name: "text", schema: { type: "string" }, description: "Search by name / phone" },
];

module.exports = {
    "/admin/user": {
        get: {
            tags: [tag],
            summary: "List users",
            security,
            parameters: [
                ...paginationParams,
                { in: "query", name: "status", schema: { type: "integer" } },
                { in: "query", name: "role_id", schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Paginated user list",
                    content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/PaginatedResponse" }, { properties: { data: { type: "array", items: { $ref: "#/components/schemas/User" } } } }] } } },
                },
            },
        },
        post: {
            tags: [tag],
            summary: "Create user (admin)",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/UserCreateRequest" } } },
            },
            responses: {
                201: { description: "Created user", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/User" } } } } } },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/user/{id}": {
        get: {
            tags: [tag],
            summary: "Get user by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
            responses: {
                200: { description: "User", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/User" } } } } } },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: [tag],
            summary: "Update user",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UserCreateRequest" } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete user",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/user/{id}/restore": {
        patch: {
            tags: [tag],
            summary: "Restore soft-deleted user",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
            responses: { 200: { description: "Restored" } },
        },
    },
    "/admin/roles": {
        get: {
            tags: [tag],
            summary: "List roles",
            security,
            responses: {
                200: { description: "Role list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Role" } } } } } } },
            },
            post: {
                tags: [tag],
                summary: "Create role",
                security,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string" },
                                    permissions: { type: "array", items: { type: "integer" } },
                                    modules: { type: "array", items: { type: "integer" } },
                                    start_page: { type: "integer" },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: "Created" } },
            },
        },
        "/admin/roles/{id}": {
            put: {
                tags: [tag],
                summary: "Update role",
                security,
                parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Role" } } } },
                responses: { 200: { description: "Updated" } },
            },
            delete: {
                tags: [tag],
                summary: "Delete role",
                security,
                parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
                responses: { 200: { description: "Deleted" } },
            },
        }
    }
};
