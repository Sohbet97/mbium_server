const security = [{ BearerAuth: [] }];

module.exports = {
    // ── App Configuration ─────────────────────────────────────────────────────
    "/admin/configurations": {
        get: {
            tags: ["System"],
            summary: "Get application configuration",
            description: "Registered before the auth middleware in the admin router, so this endpoint is effectively public.",
            responses: { 200: { description: "Configuration object" } },
        },
        put: {
            tags: ["System"],
            summary: "Update application configuration",
            requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
            responses: { 200: { description: "Updated configuration" } },
        },
    },

    // ── Activity Log ──────────────────────────────────────────────────────────
    "/admin/log": {
        get: {
            tags: ["System"],
            summary: "List activity log entries",
            security,
            parameters: [
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip",  schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Log entries" } },
        },
        delete: {
            tags: ["System"],
            summary: "Bulk-delete log entries",
            security,
            requestBody: { required: false, content: { "application/json": { schema: { type: "object", description: "Filter/ids of entries to delete" } } } },
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/log/count": {
        get: {
            tags: ["System"],
            summary: "Count log entries",
            security,
            responses: { 200: { description: "Count", content: { "application/json": { schema: { type: "object", properties: { count: { type: "integer" } } } } } } },
        },
    },
    "/admin/log/filter": {
        get: {
            tags: ["System"],
            summary: "Distinct log filter values (for building UI filters)",
            security,
            responses: { 200: { description: "Filter values" } },
        },
    },
    "/admin/log/{id}": {
        get: {
            tags: ["System"],
            summary: "Get log entry by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Log entry" }, 404: { description: "Not found" } },
        },
    },

    // ── System Dumps ──────────────────────────────────────────────────────────
    "/admin/system-dumps": {
        get: {
            tags: ["System"],
            summary: "List system dumps",
            security,
            responses: { 200: { description: "System dump list" } },
        },
        post: {
            tags: ["System"],
            summary: "Create a system dump record",
            security,
            requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
            responses: { 201: { description: "Created" } },
        },
    },
    "/admin/system-dumps/cout": {
        get: {
            tags: ["System"],
            summary: "Count system dumps",
            description: "Note: the real route path has a typo (`cout` instead of `count`), preserved here to match the actual API.",
            security,
            responses: { 200: { description: "Count", content: { "application/json": { schema: { type: "object", properties: { count: { type: "integer" } } } } } } },
        },
    },
    "/admin/system-dumps/{id}": {
        get: {
            tags: ["System"],
            summary: "Get system dump by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "System dump" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: ["System"],
            summary: "Delete system dump",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },

    // ── Audit Log ─────────────────────────────────────────────────────────────
    "/admin/audit-logs": {
        get: {
            tags: ["System"],
            summary: "List audit log entries (who did what, when)",
            security,
            parameters: [
                { in: "query", name: "entity_type", schema: { type: "string" } },
                { in: "query", name: "actor_id",    schema: { type: "string", format: "uuid" } },
                { in: "query", name: "action",      schema: { type: "string" } },
                { in: "query", name: "date_from",   schema: { type: "string", format: "date" } },
                { in: "query", name: "date_to",     schema: { type: "string", format: "date" } },
                { in: "query", name: "search",      schema: { type: "string" } },
                { in: "query", name: "limit",       schema: { type: "integer" } },
                { in: "query", name: "skip",        schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Paginated audit log entries",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { type: "object" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
    },
};
