const security = [{ BearerAuth: [] }];
const idParam  = { in: "path", name: "id", required: true, schema: { type: "integer" } };

// Admin CRUD for AI recommendation cards shown on the buyer AI Agent screen.
// All routes require auth + AI_GET/POST/PUT/DELETE permission.
module.exports = {

    "/admin/ai-recommendations": {
        get: {
            tags: ["AI Recommendations"],
            summary: "List all AI recommendation cards (admin, includes inactive)",
            security,
            responses: {
                200: {
                    description: "All AI recommendations",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/AiRecommendation" } },
                    } } } },
                },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden — missing AI_GET permission" },
            },
        },
        post: {
            tags: ["AI Recommendations"],
            summary: "Create an AI recommendation card",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/AiRecommendationRequest" } } },
            },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/AiRecommendation" } } } } } },
                400: { description: "Missing required fields" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden — missing AI_POST permission" },
            },
        },
    },

    "/admin/ai-recommendations/{id}": {
        put: {
            tags: ["AI Recommendations"],
            summary: "Update an AI recommendation card",
            security,
            parameters: [idParam],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/AiRecommendationRequest" } } },
            },
            responses: {
                200: { description: "Updated card" },
                404: { description: "Not found" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden" },
            },
        },
        delete: {
            tags: ["AI Recommendations"],
            summary: "Delete an AI recommendation card",
            security,
            parameters: [idParam],
            responses: {
                200: { description: "Deleted" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden" },
            },
        },
    },
};
