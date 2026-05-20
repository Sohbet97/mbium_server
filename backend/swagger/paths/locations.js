const security = [{ BearerAuth: [] }];

const crudLocation = (base, tag, schema) => ({
    [base]: {
        get: {
            tags: [tag],
            summary: `List ${schema.toLowerCase()}s`,
            security,
            parameters: [
                { in: "query", name: "text",   schema: { type: "string" } },
                { in: "query", name: "limit",  schema: { type: "integer" } },
                { in: "query", name: "skip",   schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "List",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: `#/components/schemas/${schema}` } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
        post: {
            tags: [tag],
            summary: `Create ${schema.toLowerCase()}`,
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } } } },
            },
            responses: { 201: { description: "Created" } },
        },
    },
    [`${base}/{id}`]: {
        put: {
            tags: [tag],
            summary: `Update ${schema.toLowerCase()}`,
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" } } } } },
            },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: `Delete ${schema.toLowerCase()}`,
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
});

module.exports = {
    ...crudLocation("/admin/country",   "Locations", "Country"),
    ...crudLocation("/admin/region",    "Locations", "Region"),
    ...crudLocation("/admin/districts", "Locations", "District"),
    ...crudLocation("/admin/village",   "Locations", "Village"),

    // Cities have an extra `region_id` filter
    "/admin/city": {
        get: {
            tags: ["Locations"],
            summary: "List cities",
            security,
            parameters: [
                { in: "query", name: "text",      schema: { type: "string" } },
                { in: "query", name: "region_id", schema: { type: "integer" } },
                { in: "query", name: "limit",     schema: { type: "integer" } },
                { in: "query", name: "skip",      schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Cities",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/City" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
        post: {
            tags: ["Locations"],
            summary: "Create city",
            security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["name"], properties: {
                    name:      { type: "string" },
                    region_id: { type: "integer" },
                } } } },
            },
            responses: { 201: { description: "Created" } },
        },
    },
    "/admin/city/{id}": {
        put: {
            tags: ["Locations"],
            summary: "Update city",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    name:      { type: "string" },
                    region_id: { type: "integer" },
                } } } },
            },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: ["Locations"],
            summary: "Delete city",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
};
