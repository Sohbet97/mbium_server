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
    "/admin/user/{id}/unlock": {
        put: {
            tags: [tag],
            summary: "Unlock a locked user account",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
            responses: { 200: { description: "Unlocked" }, 404: { description: "Not found" } },
        },
    },
    "/admin/user/{id}/force": {
        delete: {
            tags: [tag],
            summary: "Permanently delete user",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
            responses: { 200: { description: "Deleted permanently" } },
        },
    },

    // ── Roles ─────────────────────────────────────────────────────────────────
    "/admin/roles": {
        get: {
            tags: [tag],
            summary: "List roles",
            security,
            responses: {
                200: { description: "Role list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Role" } } } } } } },
            },
        },
        post: {
            tags: [tag],
            summary: "Create role",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["name"], properties: {
                    name: { type: "string" },
                    permissions: { type: "array", items: { type: "integer" } },
                    modules: { type: "array", items: { type: "integer" } },
                    start_page: { type: "integer" },
                } } } },
            },
            responses: { 201: { description: "Created" } },
        },
    },
    "/admin/roles/count": {
        get: {
            tags: [tag],
            summary: "Count roles",
            security,
            responses: { 200: { description: "Count", content: { "application/json": { schema: { type: "object", properties: { count: { type: "integer" } } } } } } },
        },
    },
    "/admin/roles/{id}": {
        get: {
            tags: [tag],
            summary: "Get role by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Role", content: { "application/json": { schema: { $ref: "#/components/schemas/Role" } } } }, 404: { description: "Not found" } },
        },
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
    },

    // ── Positions ─────────────────────────────────────────────────────────────
    "/admin/positions": {
        get: {
            tags: [tag],
            summary: "List positions",
            security,
            parameters: paginationParams,
            responses: { 200: { description: "Position list" } },
        },
        post: {
            tags: [tag],
            summary: "Create position",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["name"], properties: {
                    name: { type: "string" },
                    department_id: { type: "integer", nullable: true },
                } } } },
            },
            responses: { 201: { description: "Created" } },
        },
    },
    "/admin/positions/filter": {
        get: {
            tags: [tag],
            summary: "Distinct position filter values (for building UI filters)",
            security,
            responses: { 200: { description: "Filter values" } },
        },
    },
    "/admin/positions/count": {
        get: {
            tags: [tag],
            summary: "Count positions",
            security,
            responses: { 200: { description: "Count", content: { "application/json": { schema: { type: "object", properties: { count: { type: "integer" } } } } } } },
        },
    },
    "/admin/positions/by-departments": {
        get: {
            tags: [tag],
            summary: "Positions grouped by department",
            security,
            responses: { 200: { description: "Positions grouped by department" } },
        },
    },
    "/admin/positions/{id}": {
        get: {
            tags: [tag],
            summary: "Get position by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Position" }, 404: { description: "Not found" } },
        },
        put: {
            tags: [tag],
            summary: "Update position",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    name: { type: "string" },
                    department_id: { type: "integer", nullable: true },
                } } } },
            },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: [tag],
            summary: "Delete position",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },

    // ── User Notes ────────────────────────────────────────────────────────────
    "/admin/user-note": {
        get: {
            tags: [tag],
            summary: "List user notes",
            security,
            parameters: [{ in: "query", name: "user_id", schema: { type: "string", format: "uuid" } }],
            responses: { 200: { description: "User note list" } },
        },
        post: {
            tags: [tag],
            summary: "Create user note",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["user_id", "note"], properties: {
                    user_id: { type: "string", format: "uuid" },
                    note:    { type: "string" },
                } } } },
            },
            responses: { 201: { description: "Created" } },
        },
        put: {
            tags: [tag],
            summary: "Update user note",
            description: "The note ID is passed in the request body (no `:id` path segment).",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["id"], properties: {
                    id:   { type: "integer" },
                    note: { type: "string" },
                } } } },
            },
            responses: { 200: { description: "Updated" } },
        },
    },
    "/admin/user-note/own": {
        get: {
            tags: [tag],
            summary: "List notes created by the current admin user",
            security,
            responses: { 200: { description: "Own user notes" } },
        },
    },
    "/admin/user-note/{id}": {
        get: {
            tags: [tag],
            summary: "Get user note by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "User note" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: "Delete user note",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },

    // ── Position Assignments ──────────────────────────────────────────────────
    "/admin/position-assignments": {
        get: {
            tags: [tag],
            summary: "List user↔position assignments",
            security,
            parameters: paginationParams,
            responses: { 200: { description: "Assignment list" } },
        },
        post: {
            tags: [tag],
            summary: "Create assignment",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["user_id", "position_id"], properties: {
                    user_id:     { type: "string", format: "uuid" },
                    position_id: { type: "integer" },
                } } } },
            },
            responses: { 201: { description: "Created" } },
        },
    },
    "/admin/position-assignments/count": {
        get: {
            tags: [tag],
            summary: "Count assignments",
            security,
            responses: { 200: { description: "Count", content: { "application/json": { schema: { type: "object", properties: { count: { type: "integer" } } } } } } },
        },
    },
    "/admin/position-assignments/elements": {
        get: {
            tags: [tag],
            summary: "Distinct assignment filter values (for building UI filters)",
            security,
            responses: { 200: { description: "Filter values" } },
        },
    },
    "/admin/position-assignments/{id}": {
        get: {
            tags: [tag],
            summary: "Get assignment by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Assignment" }, 404: { description: "Not found" } },
        },
        put: {
            tags: [tag],
            summary: "Update assignment",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    user_id:     { type: "string", format: "uuid" },
                    position_id: { type: "integer" },
                } } } },
            },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: [tag],
            summary: "Soft-delete assignment",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/position-assignments/{id}/restore": {
        patch: {
            tags: [tag],
            summary: "Restore soft-deleted assignment",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Restored" } },
        },
    },
    "/admin/position-assignments/{id}/force": {
        delete: {
            tags: [tag],
            summary: "Permanently delete assignment",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted permanently" } },
        },
    },
};
