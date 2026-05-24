const security = [{ BearerAuth: [] }];

const messageItem = {
    type: "object",
    properties: {
        role:    { type: "string", enum: ["user", "assistant"], example: "user" },
        content: { type: "string", example: "How can I improve my product listings?" },
    },
};

const conversationSummary = {
    type: "object",
    properties: {
        id:        { type: "integer", example: 1 },
        title:     { type: "string", example: "Product listing tips" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

const conversationFull = {
    type: "object",
    properties: {
        id:        { type: "integer", example: 1 },
        title:     { type: "string", example: "Product listing tips" },
        messages:  { type: "array", items: messageItem },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

module.exports = {
    // ── Admin chat ────────────────────────────────────────────────────────────────
    "/admin/ai/chat": {
        post: {
            tags: ["AI Chat"],
            summary: "Stream an AI chat response (admin)",
            description:
                "Sends a conversation history to the Gemini model and streams the reply as Server-Sent Events. " +
                "Each SSE line is `data: {\"text\": \"...\"}`. The stream ends with `data: [DONE]`. " +
                "Max 40 turns kept; each message content capped at 4 000 chars.",
            security,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["messages"],
                            properties: {
                                messages: {
                                    type: "array",
                                    items: messageItem,
                                    minItems: 1,
                                    description: "Full conversation history including the latest user turn",
                                },
                                lang: {
                                    type: "string",
                                    enum: ["tk", "ru", "en"],
                                    default: "en",
                                    description: "Preferred response language (AI will usually match the user's language automatically)",
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "SSE stream of assistant text chunks",
                    content: { "text/event-stream": { schema: { type: "string", example: "data: {\"text\": \"Sure, here are\"}\n\ndata: [DONE]\n\n" } } },
                },
                400: { description: "messages[] missing or empty" },
                401: { description: "Unauthorized" },
            },
        },
    },

    // ── Admin AI conversations ────────────────────────────────────────────────────
    "/admin/ai/conversations": {
        get: {
            tags: ["AI Chat"],
            summary: "List saved AI conversations (admin)",
            description: "Returns all conversations saved by the authenticated admin user, sorted newest first.",
            security,
            responses: {
                200: {
                    description: "Conversation list",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data: { type: "array", items: conversationSummary },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
            },
        },
        post: {
            tags: ["AI Chat"],
            summary: "Save a new AI conversation (admin)",
            description: "Creates a new conversation record with a title and the full messages array.",
            security,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["title", "messages"],
                            properties: {
                                title:    { type: "string", maxLength: 200, example: "Product listing tips" },
                                messages: { type: "array", items: messageItem },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: "Conversation created",
                    content: { "application/json": { schema: { type: "object", properties: { model: conversationFull } } } },
                },
                401: { description: "Unauthorized" },
            },
        },
    },

    "/admin/ai/conversations/{id}": {
        get: {
            tags: ["AI Chat"],
            summary: "Get a saved AI conversation with messages (admin)",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: {
                    description: "Conversation with messages",
                    content: { "application/json": { schema: { type: "object", properties: { model: conversationFull } } } },
                },
                401: { description: "Unauthorized" },
                404: { description: "Not found or belongs to another user" },
            },
        },
        put: {
            tags: ["AI Chat"],
            summary: "Update a saved AI conversation (admin)",
            description: "Replaces the title and/or messages array. Used to persist updated messages after each exchange.",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                title:    { type: "string", maxLength: 200 },
                                messages: { type: "array", items: messageItem },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Updated conversation", content: { "application/json": { schema: { type: "object", properties: { model: conversationFull } } } } },
                401: { description: "Unauthorized" },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: ["AI Chat"],
            summary: "Delete a saved AI conversation (admin)",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Deleted" },
                401: { description: "Unauthorized" },
                404: { description: "Not found" },
            },
        },
    },

    // ── Buyer chat ────────────────────────────────────────────────────────────────
    "/buyer/ai/chat": {
        post: {
            tags: ["Buyer — AI"],
            summary: "Stream an AI chat response (buyer / mobile app)",
            description:
                "Same SSE streaming interface as the admin endpoint but accessible to authenticated buyers. " +
                "Responses are contextualised for shoppers (product search, order help, marketplace FAQs).",
            security,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["messages"],
                            properties: {
                                messages: { type: "array", items: messageItem, minItems: 1 },
                                lang: { type: "string", enum: ["tk", "ru", "en"], default: "en" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "SSE stream", content: { "text/event-stream": { schema: { type: "string" } } } },
                400: { description: "messages[] missing or empty" },
                401: { description: "Unauthorized" },
            },
        },
    },

    "/buyer/ai/conversations": {
        get: {
            tags: ["Buyer — AI"],
            summary: "List saved AI conversations (buyer)",
            description: "Returns all conversations saved by the authenticated buyer, sorted newest first.",
            security,
            responses: {
                200: {
                    description: "Conversation list",
                    content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: conversationSummary } } } } },
                },
                401: { description: "Unauthorized" },
            },
        },
        post: {
            tags: ["Buyer — AI"],
            summary: "Save a new AI conversation (buyer)",
            security,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["title", "messages"],
                            properties: {
                                title:    { type: "string", maxLength: 200 },
                                messages: { type: "array", items: messageItem },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: conversationFull } } } } },
                401: { description: "Unauthorized" },
            },
        },
    },

    "/buyer/ai/conversations/{id}": {
        get: {
            tags: ["Buyer — AI"],
            summary: "Get a buyer AI conversation with messages",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Conversation", content: { "application/json": { schema: { type: "object", properties: { model: conversationFull } } } } },
                401: { description: "Unauthorized" },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: ["Buyer — AI"],
            summary: "Update a buyer AI conversation",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                title:    { type: "string", maxLength: 200 },
                                messages: { type: "array", items: messageItem },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { model: conversationFull } } } } },
                401: { description: "Unauthorized" },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: ["Buyer — AI"],
            summary: "Delete a buyer AI conversation",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Deleted" },
                401: { description: "Unauthorized" },
                404: { description: "Not found" },
            },
        },
    },
};
