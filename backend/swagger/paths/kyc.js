const tag = "KYC Documents";
const security = [{ BearerAuth: [] }];

module.exports = {
    // ── Admin — global KYC queue ──────────────────────────────────────────────
    "/admin/kyc": {
        get: {
            tags: [tag],
            summary: "List all KYC documents (admin queue)",
            security,
            parameters: [
                { in: "query", name: "status",  schema: { type: "string", enum: ["pending", "approved", "rejected"] } },
                { in: "query", name: "shop_id", schema: { type: "integer" } },
                { in: "query", name: "limit",   schema: { type: "integer", default: 40 } },
                { in: "query", name: "skip",    schema: { type: "integer", default: 0 } },
            ],
            responses: {
                200: {
                    description: "Paginated KYC document list",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/KycDocument" } },
                        count: { type: "integer" },
                    }}}},
                },
            },
        },
    },

    // ── Per-shop KYC sub-resource ─────────────────────────────────────────────
    "/admin/shops/{shopId}/kyc": {
        get: {
            tags: [tag],
            summary: "List KYC documents for a specific shop",
            security,
            parameters: [
                { in: "path", name: "shopId", required: true, schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "KYC documents for the shop",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/KycDocument" } },
                    }}}},
                },
            },
        },
        post: {
            tags: [tag],
            summary: "Submit a new KYC document record for a shop",
            security,
            parameters: [
                { in: "path", name: "shopId", required: true, schema: { type: "integer" } },
            ],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/KycDocumentRequest" } } },
            },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/KycDocument" } } } } } },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/shops/{shopId}/kyc/upload": {
        post: {
            tags: [tag],
            summary: "Upload a KYC file and receive its URL",
            description: "Use the returned `file_url` in a subsequent POST to `/admin/shops/{shopId}/kyc`.",
            security,
            parameters: [
                { in: "path", name: "shopId", required: true, schema: { type: "integer" } },
            ],
            requestBody: {
                required: true,
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            required: ["file"],
                            properties: {
                                file: { type: "string", format: "binary", description: "Image, PDF, or video (max 100 MB)" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "Upload successful",
                    content: { "application/json": { schema: { type: "object", properties: {
                        file_url: { type: "string", example: "/static/shop-docs/uuid-file.pdf" },
                    }}}},
                },
                400: { description: "No file or unsupported type" },
            },
        },
    },
    "/admin/shops/{shopId}/kyc/{docId}/status": {
        patch: {
            tags: [tag],
            summary: "Approve or reject a KYC document",
            security,
            parameters: [
                { in: "path", name: "shopId", required: true, schema: { type: "integer" } },
                { in: "path", name: "docId",  required: true, schema: { type: "integer" } },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["status"],
                            properties: {
                                status: { type: "string", enum: ["approved", "rejected"] },
                                note:   { type: "string", nullable: true, description: "Optional reviewer note" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Status updated", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/KycDocument" } } } } } },
                404: { description: "Not found" },
            },
        },
    },
    "/admin/shops/{shopId}/kyc/{docId}": {
        delete: {
            tags: [tag],
            summary: "Delete a KYC document",
            security,
            parameters: [
                { in: "path", name: "shopId", required: true, schema: { type: "integer" } },
                { in: "path", name: "docId",  required: true, schema: { type: "integer" } },
            ],
            responses: {
                200: { description: "Deleted" },
                404: { description: "Not found" },
            },
        },
    },
};
