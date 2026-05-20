const security = [{ BearerAuth: [] }];
const idParam  = { in: "path", name: "id", required: true, schema: { type: "integer" } };

module.exports = {
    "/admin/notifications": {
        get: {
            tags: ["Notifications"],
            summary: "List notifications for the current admin user",
            security,
            parameters: [
                { in: "query", name: "is_read", schema: { type: "boolean" } },
                { in: "query", name: "limit",   schema: { type: "integer" } },
                { in: "query", name: "skip",    schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Paginated notifications",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Notification" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
    },
    "/admin/notifications/count": {
        get: {
            tags: ["Notifications"],
            summary: "Unread notification count",
            security,
            responses: {
                200: {
                    description: "Count",
                    content: { "application/json": { schema: { type: "object", properties: { count: { type: "integer" } } } } },
                },
            },
        },
    },
    "/admin/notifications/read-all": {
        patch: {
            tags: ["Notifications"],
            summary: "Mark all notifications as read",
            security,
            responses: { 200: { description: "All marked as read" } },
        },
    },
    "/admin/notifications/{id}/read": {
        patch: {
            tags: ["Notifications"],
            summary: "Mark a single notification as read",
            security,
            parameters: [idParam],
            responses: { 200: { description: "Marked as read" }, 404: { description: "Not found" } },
        },
    },
};
