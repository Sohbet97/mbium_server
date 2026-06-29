const security    = [{ BearerAuth: [] }];
const idParam     = { in: "path", name: "id", required: true, schema: { type: "integer" } };
const shopHeader  = { $ref: "#/components/parameters/XShopId" };

// All seller routes require auth + approved shop (seller-middleware).
// Pass X-Shop-Id header to select a specific shop when the seller owns multiple.
module.exports = {
    // ── Plans & Subscription (read-only for seller) ───────────────────────────────
    "/seller/plans": {
        get: {
            tags: ["Seller"],
            summary: "List all active plans (for comparison UI)",
            security,
            parameters: [shopHeader],
            responses: {
                200: {
                    description: "Active plans",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/Plan" } },
                    } } } },
                },
            },
        },
    },
    "/seller/subscription": {
        get: {
            tags: ["Seller"],
            summary: "Get the current active subscription for the seller's shop",
            security,
            parameters: [shopHeader],
            responses: {
                200: {
                    description: "Active subscription or null",
                    content: { "application/json": { schema: { type: "object", properties: {
                        model: { $ref: "#/components/schemas/ShopSubscription" },
                    } } } },
                },
            },
        },
    },

    // ── Dashboard ─────────────────────────────────────────────────────────────────
    "/seller/dashboard": {
        get: {
            tags: ["Seller"],
            summary: "Seller dashboard summary (revenue, orders, top products)",
            security,
            parameters: [shopHeader],
            responses: { 200: { description: "Dashboard data" } },
        },
    },

    // ── Shop ──────────────────────────────────────────────────────────────────────
    "/seller/shop": {
        get: {
            tags: ["Seller"],
            summary: "Get own shop profile (includes categories)",
            security,
            parameters: [shopHeader],
            responses: { 200: { description: "Shop", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Shop" } } } } } } },
        },
        patch: {
            tags: ["Seller"],
            summary: "Update own shop profile fields",
            security,
            parameters: [shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    name:           { type: "string" },
                    name_ru:        { type: "string" },
                    name_eng:       { type: "string" },
                    description_tm: { type: "string" },
                    description_ru: { type: "string" },
                    description_en: { type: "string" },
                    phone:          { type: "string" },
                    email:          { type: "string" },
                    address:        { type: "string" },
                } } } },
            },
            responses: { 200: { description: "Updated shop" } },
        },
    },
    "/seller/shop/categories": {
        put: {
            tags: ["Seller"],
            summary: "Set shop categories (full replace)",
            security,
            parameters: [shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    category_ids: { type: "array", items: { type: "integer" } },
                } } } },
            },
            responses: { 200: { description: "Updated shop with new categories" } },
        },
    },
    "/seller/shop/logo": {
        post: {
            tags: ["Seller"],
            summary: "Upload shop logo",
            security,
            parameters: [shopHeader],
            requestBody: {
                required: true,
                content: { "multipart/form-data": { schema: { type: "object", required: ["logo"], properties: {
                    logo: { type: "string", format: "binary" },
                } } } },
            },
            responses: { 200: { description: "Logo uploaded, returns updated shop" } },
        },
    },
    "/seller/shop/docs": {
        post: {
            tags: ["Seller"],
            summary: "Upload KYC documents or update IBAN/card number",
            security,
            parameters: [shopHeader],
            requestBody: {
                required: true,
                content: { "multipart/form-data": { schema: { type: "object", properties: {
                    passport_file: { type: "string", format: "binary" },
                    patent_file:   { type: "string", format: "binary" },
                    video_url:     { type: "string", format: "binary" },
                    bank_iban:     { type: "string" },
                    card_number:   { type: "string" },
                } } } },
            },
            responses: { 200: { description: "Docs uploaded, returns updated shop" } },
        },
    },

    // ── Categories ────────────────────────────────────────────────────────────────
    "/seller/categories": {
        get: {
            tags: ["Seller"],
            summary: "List active categories (flat, for product form picker)",
            security,
            parameters: [shopHeader],
            responses: {
                200: {
                    description: "Categories",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/Category" } },
                    } } } },
                },
            },
        },
    },

    // ── Products ──────────────────────────────────────────────────────────────────
    "/seller/products": {
        get: {
            tags: ["Seller"],
            summary: "List own shop products",
            security,
            parameters: [
                shopHeader,
                { in: "query", name: "text",        schema: { type: "string" } },
                { in: "query", name: "category_id", schema: { type: "integer" } },
                { in: "query", name: "is_active",   schema: { type: "boolean" } },
                { in: "query", name: "limit",       schema: { type: "integer" } },
                { in: "query", name: "skip",        schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Products",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Product" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
        post: {
            tags: ["Seller"],
            summary: "Create product (enforces plan product_limit)",
            security,
            parameters: [shopHeader],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductRequest" } } } },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Product" } } } } } },
                403: { description: "Plan product limit reached" },
            },
        },
    },
    "/seller/products/{id}": {
        get: {
            tags: ["Seller"],
            summary: "Get own product by ID (includes variants)",
            security,
            parameters: [idParam, shopHeader],
            responses: { 200: { description: "Product" }, 404: { description: "Not found or not owned by seller" } },
        },
        put: {
            tags: ["Seller"],
            summary: "Update own product",
            security,
            parameters: [idParam, shopHeader],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductRequest" } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: ["Seller"],
            summary: "Soft-delete own product",
            security,
            parameters: [idParam, shopHeader],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/seller/products/{id}/variants": {
        post: {
            tags: ["Seller"],
            summary: "Add variant to own product",
            security,
            parameters: [idParam, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["name"], properties: {
                    name:             { type: "string" },
                    price:            { type: "number", nullable: true },
                    compare_at_price: { type: "number", nullable: true },
                    stock:            { type: "integer" },
                    sku:              { type: "string", nullable: true },
                    barcode:          { type: "string", nullable: true },
                    is_active:        { type: "boolean" },
                    attributes:       { type: "object" },
                } } } },
            },
            responses: { 201: { description: "Variant created" } },
        },
    },
    "/seller/products/{id}/variants/{variantId}": {
        put: {
            tags: ["Seller"],
            summary: "Update variant",
            security,
            parameters: [idParam, { in: "path", name: "variantId", required: true, schema: { type: "integer" } }, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    name:             { type: "string" },
                    price:            { type: "number", nullable: true },
                    compare_at_price: { type: "number", nullable: true },
                    stock:            { type: "integer" },
                    sku:              { type: "string", nullable: true },
                    barcode:          { type: "string", nullable: true },
                    is_active:        { type: "boolean" },
                    attributes:       { type: "object" },
                } } } },
            },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: ["Seller"],
            summary: "Delete variant",
            security,
            parameters: [idParam, { in: "path", name: "variantId", required: true, schema: { type: "integer" } }, shopHeader],
            responses: { 200: { description: "Deleted" } },
        },
    },

    // ── 360° Spin View (AI-generated) ───────────────────────────────────────────────
    "/seller/products/{id}/spin/generate": {
        post: {
            tags: ["Seller"],
            summary: "AI-generate a 360° spin frame sequence from existing product photos",
            description: "Generates a spin frame sequence (Gemini Nano Banana) from 1-4 existing product " +
                "media items and attaches them to the product as ProductMedia rows with role='spin', " +
                "replacing any previously generated/uploaded spin frames.",
            security,
            parameters: [idParam, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["media_ids"], properties: {
                    media_ids:   { type: "array", items: { type: "string", format: "uuid" }, minItems: 1, maxItems: 4, description: "Existing Media IDs (front/side/back/top photos) to use as references" },
                    frame_count: { type: "integer", enum: [12, 24, 36], default: 12 },
                } } } },
            },
            responses: {
                200: {
                    description: "Generated spin frame sequence (full product media list)",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/ProductMedia" } },
                    } } } },
                },
                400: { description: "Invalid reference count/frame count, or generation failed" },
                404: { description: "Not found or not owned by seller" },
            },
        },
    },
    "/seller/products/{id}/spin/generate-from-upload": {
        post: {
            tags: ["Seller"],
            summary: "Upload reference photos and AI-generate a 360° spin frame sequence",
            description: "Accepts 1-4 newly uploaded photos (e.g. taken on a phone), attaches them to the " +
                "product gallery, then generates a spin frame sequence (Gemini Nano Banana) from them and " +
                "attaches the frames as ProductMedia rows with role='spin', replacing any previous spin sequence.",
            security,
            parameters: [idParam, shopHeader],
            requestBody: {
                required: true,
                content: { "multipart/form-data": { schema: { type: "object", required: ["files"], properties: {
                    files:       { type: "array", items: { type: "string", format: "binary" }, minItems: 1, maxItems: 4 },
                    frame_count: { type: "integer", enum: [12, 24, 36], default: 12 },
                } } } },
            },
            responses: {
                200: {
                    description: "Generated spin frame sequence (full product media list)",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/ProductMedia" } },
                    } } } },
                },
                400: { description: "No files uploaded, invalid frame count, or generation failed" },
                404: { description: "Not found or not owned by seller" },
            },
        },
    },

    // ── Orders ────────────────────────────────────────────────────────────────────
    "/seller/orders": {
        get: {
            tags: ["Seller"],
            summary: "List orders for own shop",
            security,
            parameters: [
                shopHeader,
                { in: "query", name: "status", schema: { type: "integer" }, description: "0=pending, 1=confirmed, 2=processing, 3=shipped, 4=delivered, 5=closed, 10=cancelled" },
                { in: "query", name: "limit",  schema: { type: "integer" } },
                { in: "query", name: "skip",   schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Orders",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Order" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
    },
    "/seller/orders/{id}": {
        get: {
            tags: ["Seller"],
            summary: "Get single order detail",
            security,
            parameters: [idParam, shopHeader],
            responses: { 200: { description: "Order detail" }, 404: { description: "Not found" } },
        },
    },
    "/seller/orders/{id}/status": {
        patch: {
            tags: ["Seller"],
            summary: "Advance order status (seller can move to confirmed/processing/shipped only)",
            security,
            parameters: [idParam, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["status"], properties: {
                    status: { type: "integer" },
                } } } },
            },
            responses: { 200: { description: "Status updated" }, 403: { description: "Not allowed to set this status" } },
        },
    },
    "/seller/orders/{id}/shipments": {
        get: {
            tags: ["Seller"],
            summary: "List shipments for an order",
            security,
            parameters: [idParam, shopHeader],
            responses: { 200: { description: "Shipments" } },
        },
        post: {
            tags: ["Seller"],
            summary: "Add shipment tracking",
            security,
            parameters: [idParam, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    carrier:         { type: "string" },
                    tracking_number: { type: "string" },
                } } } },
            },
            responses: { 201: { description: "Shipment added" } },
        },
    },

    // ── Discounts ─────────────────────────────────────────────────────────────────
    "/seller/discounts": {
        get: {
            tags: ["Seller"],
            summary: "List own shop discount codes",
            security,
            parameters: [
                shopHeader,
                { in: "query", name: "is_active", schema: { type: "boolean" } },
                { in: "query", name: "limit",     schema: { type: "integer" } },
                { in: "query", name: "skip",      schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Discounts",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/Discount" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
        post: {
            tags: ["Seller"],
            summary: "Create discount code",
            security,
            parameters: [shopHeader],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DiscountRequest" } } } },
            responses: { 201: { description: "Created" } },
        },
    },
    "/seller/discounts/{id}": {
        put: {
            tags: ["Seller"],
            summary: "Update discount",
            security,
            parameters: [idParam, shopHeader],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DiscountRequest" } } } },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: ["Seller"],
            summary: "Delete discount",
            security,
            parameters: [idParam, shopHeader],
            responses: { 200: { description: "Deleted" } },
        },
    },

    // ── Payouts ───────────────────────────────────────────────────────────────────
    "/seller/payouts/balance": {
        get: {
            tags: ["Seller"],
            summary: "Get seller payout balance",
            security,
            parameters: [shopHeader],
            responses: {
                200: {
                    description: "Balance",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/SellerBalance" } } },
                },
            },
        },
    },
    "/seller/payouts/history": {
        get: {
            tags: ["Seller"],
            summary: "Payout request history",
            security,
            parameters: [
                shopHeader,
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip",  schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Payout history" } },
        },
    },
    "/seller/payouts/request": {
        post: {
            tags: ["Seller"],
            summary: "Request a payout",
            security,
            parameters: [shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["amount"], properties: {
                    amount:   { type: "number" },
                    currency: { type: "string", default: "TMT" },
                    note:     { type: "string" },
                } } } },
            },
            responses: { 201: { description: "Payout request submitted" } },
        },
    },

    // ── Media ─────────────────────────────────────────────────────────────────────
    "/seller/media": {
        get: {
            tags: ["Seller"],
            summary: "List own media files",
            security,
            parameters: [
                shopHeader,
                { in: "query", name: "media_type", schema: { type: "string" }, description: "image or video" },
                { in: "query", name: "text",       schema: { type: "string" } },
                { in: "query", name: "limit",      schema: { type: "integer" } },
                { in: "query", name: "skip",       schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Media list" } },
        },
    },
    "/seller/media/upload": {
        post: {
            tags: ["Seller"],
            summary: "Upload a media file",
            security,
            parameters: [
                shopHeader,
                { in: "query", name: "media_type", schema: { type: "string" }, description: "image or video" },
            ],
            requestBody: {
                required: true,
                content: { "multipart/form-data": { schema: { type: "object", required: ["file"], properties: {
                    file: { type: "string", format: "binary" },
                } } } },
            },
            responses: { 201: { description: "Uploaded" } },
        },
    },
    "/seller/media/{id}": {
        delete: {
            tags: ["Seller"],
            summary: "Delete own media file",
            security,
            parameters: [idParam, shopHeader],
            responses: { 200: { description: "Deleted" }, 403: { description: "Not owner" } },
        },
    },
    "/seller/media/product/{productId}": {
        get: {
            tags: ["Seller"],
            summary: "Get media attached to a product",
            security,
            parameters: [{ in: "path", name: "productId", required: true, schema: { type: "integer" } }, shopHeader],
            responses: { 200: { description: "Product media list" } },
        },
        post: {
            tags: ["Seller"],
            summary: "Attach media to a product",
            security,
            parameters: [{ in: "path", name: "productId", required: true, schema: { type: "integer" } }, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["media_id"], properties: {
                    media_id:   { type: "integer" },
                    role:       { type: "string", enum: ["primary", "gallery"] },
                    sort_order: { type: "integer" },
                } } } },
            },
            responses: { 201: { description: "Attached" } },
        },
    },
    "/seller/media/product/{productId}/{mediaId}": {
        patch: {
            tags: ["Seller"],
            summary: "Update product-media relationship (role, sort_order)",
            security,
            parameters: [
                { in: "path", name: "productId", required: true, schema: { type: "integer" } },
                { in: "path", name: "mediaId",   required: true, schema: { type: "integer" } },
                shopHeader,
            ],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    role:       { type: "string", enum: ["primary", "gallery"] },
                    sort_order: { type: "integer" },
                } } } },
            },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: ["Seller"],
            summary: "Detach media from product",
            security,
            parameters: [
                { in: "path", name: "productId", required: true, schema: { type: "integer" } },
                { in: "path", name: "mediaId",   required: true, schema: { type: "integer" } },
                shopHeader,
            ],
            responses: { 200: { description: "Detached" } },
        },
    },

    // ── Banners ───────────────────────────────────────────────────────────────────
    "/seller/banners": {
        get: {
            tags: ["Seller"],
            summary: "List own shop banners",
            security,
            parameters: [shopHeader],
            responses: { 200: { description: "Banners list" } },
        },
        post: {
            tags: ["Seller"],
            summary: "Create banner",
            security,
            parameters: [shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["title"], properties: {
                    title:      { type: "string" },
                    subtitle:   { type: "string", nullable: true },
                    image_url:  { type: "string", nullable: true },
                    link_url:   { type: "string", nullable: true },
                    btn_label:  { type: "string", nullable: true },
                    starts_at:  { type: "string", format: "date", nullable: true },
                    ends_at:    { type: "string", format: "date", nullable: true },
                    is_active:  { type: "boolean" },
                } } } },
            },
            responses: { 201: { description: "Created" } },
        },
    },
    "/seller/banners/{id}": {
        put: {
            tags: ["Seller"],
            summary: "Update own banner",
            security,
            parameters: [idParam, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    title:      { type: "string" },
                    subtitle:   { type: "string" },
                    image_url:  { type: "string" },
                    link_url:   { type: "string" },
                    btn_label:  { type: "string" },
                    starts_at:  { type: "string", format: "date" },
                    ends_at:    { type: "string", format: "date" },
                    is_active:  { type: "boolean" },
                } } } },
            },
            responses: { 200: { description: "Updated" } },
        },
        delete: {
            tags: ["Seller"],
            summary: "Delete own banner",
            security,
            parameters: [idParam, shopHeader],
            responses: { 200: { description: "Deleted" } },
        },
    },
};
