const security = [{ BearerAuth: [] }];

const messageItem = {
    type: "object",
    properties: {
        id:        { type: "integer", example: 1 },
        chatroom_id: { type: "integer", example: 5 },
        text:      { type: "string", example: "Hello, I need help with my order." },
        createdBy: { type: "string", format: "uuid" },
        sender: {
            type: "object",
            properties: {
                id:      { type: "string", format: "uuid" },
                name:    { type: "string", example: "Ali" },
                surname: { type: "string", example: "Durdyyew" },
            },
        },
        createdAt: { type: "string", format: "date-time" },
    },
};

const roomItem = {
    type: "object",
    properties: {
        id:   { type: "integer", example: 5 },
        type: { type: "integer", example: 1 },
        participants: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    user_id: { type: "string", format: "uuid" },
                    role:    { type: "integer", example: 1, description: "1 = seller, 2 = admin" },
                    user: {
                        type: "object",
                        properties: {
                            id:           { type: "string", format: "uuid" },
                            name:         { type: "string" },
                            surname:      { type: "string" },
                            phone_number: { type: "string" },
                        },
                    },
                },
            },
        },
        messages: {
            type: "array",
            description: "Last message (1 item)",
            items: { type: "object", properties: { text: { type: "string" }, createdAt: { type: "string", format: "date-time" } } },
        },
        updatedAt: { type: "string", format: "date-time" },
    },
};

module.exports = {
    // ── List rooms ────────────────────────────────────────────────────────────────
    "/admin/support/rooms": {
        get: {
            tags: ["Admin Support"],
            summary: "List all seller support rooms",
            description:
                "Returns all support chat rooms (type = 1), each with the seller participant and the latest message. " +
                "Use `?search=` to filter rooms by the seller's name or phone number.",
            security,
            parameters: [
                {
                    in: "query",
                    name: "search",
                    schema: { type: "string" },
                    description: "Filter by seller name or phone number (case-insensitive substring match)",
                    example: "Ali",
                },
            ],
            responses: {
                200: {
                    description: "List of support rooms",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data: { type: "array", items: roomItem },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
            },
        },
    },

    // ── Start / find room ─────────────────────────────────────────────────────────
    "/admin/support/rooms/start": {
        post: {
            tags: ["Admin Support"],
            summary: "Find or create a support room with a specific user",
            description:
                "If the user already has a support room (type = 1), returns it. " +
                "Otherwise creates a new room, adds the target user as a participant (role = 1), and returns the room.",
            security,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["user_id"],
                            properties: {
                                user_id: { type: "string", format: "uuid", description: "Target user to start a conversation with" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "Existing room returned",
                    content: { "application/json": { schema: { type: "object", properties: { data: roomItem } } } },
                },
                201: {
                    description: "New room created",
                    content: { "application/json": { schema: { type: "object", properties: { data: roomItem } } } },
                },
                400: { description: "user_id missing" },
                401: { description: "Unauthorized" },
                404: { description: "Target user not found" },
            },
        },
    },

    // ── Room messages ─────────────────────────────────────────────────────────────
    "/admin/support/rooms/{id}/messages": {
        get: {
            tags: ["Admin Support"],
            summary: "Get messages for a support room",
            description: "Returns paginated messages for the given room, ordered chronologically.",
            security,
            parameters: [
                { in: "path",  name: "id",    required: true, schema: { type: "integer" }, description: "Room ID" },
                { in: "query", name: "page",  schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 80 } },
            ],
            responses: {
                200: {
                    description: "Messages",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data:  { type: "array", items: messageItem },
                                    total: { type: "integer", example: 42 },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
                404: { description: "Room not found" },
            },
        },
        post: {
            tags: ["Admin Support"],
            summary: "Send a reply to a support room",
            description:
                "Saves the message, adds the admin as a participant if not already present, and emits a `support-message` socket event to all other room participants.",
            security,
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "integer" }, description: "Room ID" },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["text"],
                            properties: {
                                text: { type: "string", example: "Hi! How can we help you today?" },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: "Message sent",
                    content: { "application/json": { schema: { type: "object", properties: { data: messageItem } } } },
                },
                400: { description: "text required" },
                401: { description: "Unauthorized" },
                404: { description: "Room not found" },
            },
        },
    },
};
