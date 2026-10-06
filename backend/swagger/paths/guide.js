const tag = "Guide";
const security = [{ BearerAuth: [] }];
const idParam = { in: "path", name: "id", required: true, schema: { type: "integer" } };
const body = {
    type: "object",
    properties: {
        title:           { type: "string" },
        title_ru:        { type: "string" },
        title_eng:       { type: "string" },
        description:     { type: "string" },
        description_ru:  { type: "string" },
        description_eng: { type: "string" },
        video:           { type: "string", description: "Video URL (upload through the media library)" },
        thumbnail:       { type: "string", description: "Preview image URL" },
        order:           { type: "integer", default: 0 },
        status:          { type: "integer", enum: [0, 1], description: "0 = inactive, 1 = active (shown to clients)" },
    },
};
const guide = {
    allOf: [{ type: "object", properties: { id: { type: "integer" }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } } }, body],
};
const model = { content: { "application/json": { schema: { type: "object", properties: { model: guide } } } } };

module.exports = {
    "/admin/guide": {
        get: {
            tags: [tag], summary: "List guide entries", security,
            parameters: [
                { in: "query", name: "status", schema: { type: "integer", enum: [0, 1] } },
                { in: "query", name: "limit",  schema: { type: "integer" } },
                { in: "query", name: "skip",   schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Entries ordered by `order`", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: guide }, count: { type: "integer" } } } } } } },
        },
        post: {
            tags: [tag], summary: "Create guide entry", security,
            requestBody: { required: true, content: { "application/json": { schema: { ...body, required: ["title"] } } } },
            responses: { 201: { description: "Created", ...model }, 400: { description: "Validation error" } },
        },
    },
    "/admin/guide/{id}": {
        get:    { tags: [tag], summary: "Get guide entry", security, parameters: [idParam], responses: { 200: { description: "Entry", ...model }, 404: { description: "Not found" } } },
        put:    { tags: [tag], summary: "Update guide entry", security, parameters: [idParam], requestBody: { required: true, content: { "application/json": { schema: body } } }, responses: { 200: { description: "Updated", ...model }, 404: { description: "Not found" } } },
        delete: { tags: [tag], summary: "Delete guide entry", security, parameters: [idParam], responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } } },
    },
    "/guide": {
        get: {
            tags: [tag], summary: "Active guide entries (client app)",
            description: "Public, no auth. Only active entries (`status = 1`), ordered by `order`.",
            responses: { 200: { description: "Entries", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: guide } } } } } } },
        },
    },
};
