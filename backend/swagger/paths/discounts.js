const tagD = "Discounts";
const tagF = "Flash Sales";
const security = [{ BearerAuth: [] }];

const crudPaths = (base, tag, schema, requestSchema) => ({
    [base]: {
        get: {
            tags: [tag],
            summary: `List ${tag.toLowerCase()}`,
            security,
            parameters: [
                { in: "query", name: "text",      schema: { type: "string" } },
                { in: "query", name: "shop_id",   schema: { type: "integer" } },
                { in: "query", name: "is_active", schema: { type: "boolean" } },
                { in: "query", name: "limit",     schema: { type: "integer" } },
                { in: "query", name: "skip",      schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Paginated list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: `#/components/schemas/${schema}` } }, count: { type: "integer" } } } } } } },
        },
        post: {
            tags: [tag],
            summary: `Create ${tag.toLowerCase().replace(" ", " ")}`,
            security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${requestSchema}` } } } },
            responses: { 201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: `#/components/schemas/${schema}` } } } } } }, 400: { description: "Validation error" } },
        },
    },
    [`${base}/{id}`]: {
        get: {
            tags: [tag],
            summary: `Get by ID`,
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Record", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: `#/components/schemas/${schema}` } } } } } }, 404: { description: "Not found" } },
        },
        put: {
            tags: [tag],
            summary: `Update`,
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${requestSchema}` } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag],
            summary: `Soft-delete`,
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    [`${base}/{id}/force`]: {
        delete: { tags: [tag], summary: "Permanently delete", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Deleted permanently" } } },
    },
    [`${base}/{id}/restore`]: {
        post: { tags: [tag], summary: "Restore soft-deleted record", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Restored" } } },
    },
});

module.exports = {
    ...crudPaths("/admin/discounts",   tagD, "Discount",  "DiscountRequest"),
    ...crudPaths("/admin/flash-sales", tagF, "FlashSale", "FlashSaleRequest"),
};
