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
            summary: "Get own product by ID (includes variants, shared media, and shared 3D models)",
            security,
            parameters: [idParam, shopHeader],
            responses: {
                200: { description: "Product", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
                404: { description: "Not found or not owned by seller" },
            },
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

    // ── Variant Sizes ─────────────────────────────────────────────────────────────
    "/seller/products/{id}/variants/{variantId}/sizes": {
        post: {
            tags: ["Seller"],
            summary: "Add a per-size stock/price row to own variant",
            description: "Nests structured size stock under a color/style variant (ProductVariantSize).",
            security,
            parameters: [idParam, { in: "path", name: "variantId", required: true, schema: { type: "integer" } }, shopHeader],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductVariantSizeRequest" } } } },
            responses: {
                201: { description: "Variant size row created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/ProductVariantSize" } } } } } },
                400: { description: "size_id required" },
                404: { description: "Not found or not owned by seller" },
            },
        },
    },
    "/seller/products/{id}/variants/{variantId}/sizes/{sizeRowId}": {
        put: {
            tags: ["Seller"],
            summary: "Update a variant size row",
            security,
            parameters: [
                idParam,
                { in: "path", name: "variantId", required: true, schema: { type: "integer" } },
                { in: "path", name: "sizeRowId", required: true, schema: { type: "integer" } },
                shopHeader,
            ],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductVariantSizeRequest" } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: ["Seller"],
            summary: "Delete a variant size row",
            security,
            parameters: [
                idParam,
                { in: "path", name: "variantId", required: true, schema: { type: "integer" } },
                { in: "path", name: "sizeRowId", required: true, schema: { type: "integer" } },
                shopHeader,
            ],
            responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } },
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
    "/seller/products/{id}/variants/{variantId}/spin/generate": {
        post: {
            tags: ["Seller"],
            summary: "AI-generate a 360° spin frame sequence scoped to one variant",
            description: "Same as `POST /seller/products/{id}/spin/generate` but the generated frames are attached to the given variant only.",
            security,
            parameters: [idParam, { in: "path", name: "variantId", required: true, schema: { type: "integer" } }, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["media_ids"], properties: {
                    media_ids:   { type: "array", items: { type: "string", format: "uuid" }, minItems: 1, maxItems: 4 },
                    frame_count: { type: "integer", enum: [12, 24, 36], default: 12 },
                } } } },
            },
            responses: {
                200: { description: "Generated spin frame sequence (variant media list)", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/ProductMedia" } } } } } } },
                400: { description: "Invalid reference count/frame count, or generation failed" },
                404: { description: "Not found or not owned by seller" },
            },
        },
    },
    "/seller/products/{id}/variants/{variantId}/spin/generate-from-upload": {
        post: {
            tags: ["Seller"],
            summary: "Upload reference photos and AI-generate a 360° spin frame sequence scoped to one variant",
            security,
            parameters: [idParam, { in: "path", name: "variantId", required: true, schema: { type: "integer" } }, shopHeader],
            requestBody: {
                required: true,
                content: { "multipart/form-data": { schema: { type: "object", required: ["files"], properties: {
                    files:       { type: "array", items: { type: "string", format: "binary" }, minItems: 1, maxItems: 4 },
                    frame_count: { type: "integer", enum: [12, 24, 36], default: 12 },
                } } } },
            },
            responses: {
                200: { description: "Generated spin frame sequence (variant media list)", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/ProductMedia" } } } } } } },
                400: { description: "No files uploaded, invalid frame count, or generation failed" },
                404: { description: "Not found or not owned by seller" },
            },
        },
    },

    // ── Media editing (background removal, rotation) ───────────────────────────────
    "/seller/products/{id}/media/{mediaId}/remove-bg": {
        post: {
            tags: ["Seller"],
            summary: "Start AI background removal for a product/variant media item",
            security,
            parameters: [idParam, { in: "path", name: "mediaId", required: true, schema: { type: "string", format: "uuid" } }, shopHeader],
            requestBody: {
                required: false,
                content: { "application/json": { schema: { type: "object", properties: {
                    variant_id: { type: "integer", nullable: true },
                } } } },
            },
            responses: {
                200: { description: "Removal preview token + result" },
                404: { description: "Media not attached to this product/variant" },
            },
        },
    },
    "/seller/products/{id}/media/{mediaId}/remove-bg/confirm": {
        post: {
            tags: ["Seller"],
            summary: "Confirm a background-removal preview (save as new media or replace original)",
            security,
            parameters: [idParam, { in: "path", name: "mediaId", required: true, schema: { type: "string", format: "uuid" } }, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["token", "action"], properties: {
                    token:      { type: "string" },
                    action:     { type: "string", enum: ["save_new", "replace"] },
                    variant:    { type: "string", default: "transparent" },
                    variant_id: { type: "integer", nullable: true },
                } } } },
            },
            responses: { 200: { description: "Media saved/replaced", content: { "application/json": { schema: { type: "object", properties: { media: { $ref: "#/components/schemas/Media" } } } } } }, 400: { description: "token and action required" } },
        },
    },
    "/seller/products/{id}/media/{mediaId}/remove-bg/reject": {
        post: {
            tags: ["Seller"],
            summary: "Reject/discard a background-removal preview",
            security,
            parameters: [idParam, { in: "path", name: "mediaId", required: true, schema: { type: "string", format: "uuid" } }, shopHeader],
            requestBody: { required: false, content: { "application/json": { schema: { type: "object", properties: { token: { type: "string" } } } } } },
            responses: { 200: { description: "Discarded" } },
        },
    },
    "/seller/products/{id}/media/{mediaId}/rotate": {
        post: {
            tags: ["Seller"],
            summary: "Rotate a media image in place (90/180/270°)",
            security,
            parameters: [idParam, { in: "path", name: "mediaId", required: true, schema: { type: "string", format: "uuid" } }, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["degrees"], properties: {
                    degrees: { type: "integer", enum: [90, 180, 270] },
                } } } },
            },
            responses: { 200: { description: "Rotated, returns updated Media", content: { "application/json": { schema: { $ref: "#/components/schemas/Media" } } } }, 400: { description: "Invalid degrees or missing sharp module" }, 404: { description: "Not found" } },
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
    "/seller/orders/{id}/items/{itemId}": {
        patch: {
            tags: ["Seller"],
            summary: "Update order item quantity (pending/confirmed orders only)",
            security,
            parameters: [idParam, { in: "path", name: "itemId", required: true, schema: { type: "integer" } }, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["quantity"], properties: {
                    quantity: { type: "integer", minimum: 1 },
                } } } },
            },
            responses: { 200: { description: "Updated order" }, 403: { description: "Order status does not allow item edits" } },
        },
        delete: {
            tags: ["Seller"],
            summary: "Remove an order item (pending/confirmed orders only)",
            security,
            parameters: [idParam, { in: "path", name: "itemId", required: true, schema: { type: "integer" } }, shopHeader],
            responses: { 200: { description: "Updated order" }, 403: { description: "Order status does not allow item removal" } },
        },
    },
    "/seller/orders/{id}/shipments/{shipmentId}": {
        patch: {
            tags: ["Seller"],
            summary: "Update shipment carrier/tracking number",
            security,
            parameters: [idParam, { in: "path", name: "shipmentId", required: true, schema: { type: "integer" } }, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    carrier:         { type: "string" },
                    tracking_number: { type: "string" },
                } } } },
            },
            responses: { 200: { description: "Updated shipment" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: ["Seller"],
            summary: "Delete shipment",
            security,
            parameters: [idParam, { in: "path", name: "shipmentId", required: true, schema: { type: "integer" } }, shopHeader],
            responses: { 200: { description: "Deleted" } },
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
    "/seller/payouts/requests": {
        get: {
            tags: ["Seller"],
            summary: "Payout request history for own shop",
            security,
            parameters: [
                shopHeader,
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip",  schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Payout requests",
                    content: { "application/json": { schema: { type: "object", properties: {
                        data:  { type: "array", items: { $ref: "#/components/schemas/PayoutRequest" } },
                        count: { type: "integer" },
                    } } } },
                },
            },
        },
        post: {
            tags: ["Seller"],
            summary: "Request a payout (withdrawal against own shop balance)",
            security,
            parameters: [shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["amount"], properties: {
                    amount: { type: "number" },
                    note:   { type: "string" },
                } } } },
            },
            responses: {
                201: { description: "Payout request submitted" },
                400: { description: "Invalid amount or balance not sufficient" },
            },
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
                { in: "query", name: "media_type", schema: { type: "string" }, description: "Override auto-detected type, e.g. '360' to mark an image as a spin frame. Type is otherwise inferred from the file (image/video/3d) — .glb/.gltf/.obj/.usdz uploads are detected as type '3d' automatically." },
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
        patch: {
            tags: ["Seller"],
            summary: "Rename own media file",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    alt_text: { type: "string", nullable: true },
                } } } },
            },
            responses: { 200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Media" } } } } } }, 403: { description: "Not owner" } },
        },
        delete: {
            tags: ["Seller"],
            summary: "Delete own media file",
            security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }, shopHeader],
            responses: { 200: { description: "Deleted" }, 403: { description: "Not owner" } },
        },
    },
    "/seller/media/product/{productId}": {
        get: {
            tags: ["Seller"],
            summary: "Get media attached to a product",
            description: "Pass `variant_id` to scope to one variant's media, or `variant_id=null` for shared product-level media only. Omit for everything (product-level + all variants).",
            security,
            parameters: [
                { in: "path", name: "productId", required: true, schema: { type: "integer" } },
                { in: "query", name: "variant_id", schema: { type: "integer" }, description: "Optional — scope to a specific variant's media" },
                shopHeader,
            ],
            responses: { 200: { description: "Product media list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/ProductMedia" } } } } } } } },
        },
        post: {
            tags: ["Seller"],
            summary: "Attach media to a product (optionally scoped to a variant)",
            security,
            parameters: [{ in: "path", name: "productId", required: true, schema: { type: "integer" } }, shopHeader],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", required: ["media_id"], properties: {
                    media_id:   { type: "string", format: "uuid" },
                    variant_id: { type: "integer", nullable: true, description: "Scope this media to a single variant (e.g. a color)" },
                    role:       { type: "string", enum: ["primary", "gallery", "video", "3d", "360", "spin"] },
                    sort_order: { type: "integer", default: 0 },
                } } } },
            },
            responses: { 200: { description: "Attached", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/ProductMedia" } } } } } } },
        },
    },
    "/seller/media/product/{productId}/{mediaId}": {
        patch: {
            tags: ["Seller"],
            summary: "Update product-media relationship (role, sort_order)",
            security,
            parameters: [
                { in: "path", name: "productId", required: true, schema: { type: "integer" } },
                { in: "path", name: "mediaId",   required: true, schema: { type: "string", format: "uuid" } },
                { in: "query", name: "variant_id", schema: { type: "integer" }, description: "Identifies which variant-scoped row to update, if any" },
                shopHeader,
            ],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { type: "object", properties: {
                    role:       { type: "string", enum: ["primary", "gallery", "video", "3d", "360", "spin"] },
                    sort_order: { type: "integer" },
                } } } },
            },
            responses: { 200: { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/ProductMedia" } } } } } } },
        },
        delete: {
            tags: ["Seller"],
            summary: "Detach media from product",
            security,
            parameters: [
                { in: "path", name: "productId", required: true, schema: { type: "integer" } },
                { in: "path", name: "mediaId",   required: true, schema: { type: "string", format: "uuid" } },
                { in: "query", name: "variant_id", schema: { type: "integer" }, description: "Identifies which variant-scoped row to detach, if any" },
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
