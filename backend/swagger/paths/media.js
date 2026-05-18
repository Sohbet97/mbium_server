const tag = "Media";
const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/media/upload": {
        post: {
            tags: [tag],
            summary: "Upload a media file",
            description: "Accepts image, video, 3D model, or 360° image. Returns stored Media record with thumbnail_url.",
            security,
            requestBody: {
                required: true,
                content: { "multipart/form-data": { schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } } } },
            },
            responses: { 201: { description: "Uploaded", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Media" } } } } } } },
        },
    },
    "/admin/media": {
        get: {
            tags: [tag],
            summary: "List media library",
            security,
            parameters: [
                { in: "query", name: "type",  schema: { type: "string", enum: ["image", "video", "3d", "360"] } },
                { in: "query", name: "text",  schema: { type: "string" }, description: "Search by original filename or alt text" },
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip",  schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Paginated media list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Media" } }, count: { type: "integer" } } } } } } },
        },
    },
    "/admin/media/{id}": {
        get: {
            tags: [tag],
            summary: "Get media file by ID",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
            responses: { 200: { description: "Media record", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Media" } } } } } }, 404: { description: "Not found" } },
        },
        patch: {
            tags: [tag],
            summary: "Update media metadata (alt_text, title)",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: { alt_text: { type: "string" }, title: { type: "string" } } } } },
            },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: [tag],
            summary: "Delete media file (removes file from disk)",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },

    // ── Product ↔ Media attachment ───────────────────────────────────────────
    "/admin/media/product/{product_id}": {
        get: {
            tags: [tag],
            summary: "Get all media attached to a product",
            security,
            parameters: [{ in: "path", name: "product_id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Product media list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/ProductMedia" } } } } } } } },
        },
        post: {
            tags: [tag],
            summary: "Attach media to a product",
            description: "Attaches an existing media item to the product. First attachment with no existing primary auto-becomes primary.",
            security,
            parameters: [{ in: "path", name: "product_id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["media_id"], properties: { media_id: { type: "string", format: "uuid" }, role: { type: "string", enum: ["primary", "gallery", "video", "3d", "360"], default: "gallery" } } } } },
            },
            responses: { 201: { description: "Attached" }, 409: { description: "Already attached" } },
        },
    },
    "/admin/media/product/{product_id}/{media_id}": {
        patch: {
            tags: [tag],
            summary: "Update product–media record (role or sort_order)",
            description: "Setting role to `primary` automatically demotes any existing primary to `gallery`.",
            security,
            parameters: [
                { in: "path", name: "product_id", required: true, schema: { type: "integer" } },
                { in: "path", name: "media_id",   required: true, schema: { type: "string", format: "uuid" } },
            ],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: { role: { type: "string", enum: ["primary", "gallery", "video", "3d", "360"] }, sort_order: { type: "integer" } } } } },
            },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: [tag],
            summary: "Detach media from product (does not delete the media file)",
            security,
            parameters: [
                { in: "path", name: "product_id", required: true, schema: { type: "integer" } },
                { in: "path", name: "media_id",   required: true, schema: { type: "string", format: "uuid" } },
            ],
            responses: { 200: { description: "Detached" } },
        },
    },
};
