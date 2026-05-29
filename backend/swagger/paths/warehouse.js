const tag      = "Warehouses";
const security = [{ BearerAuth: [] }];

const paginationParams = [
    { in: "query", name: "limit",  schema: { type: "integer", default: 20 }, description: "Max records to return" },
    { in: "query", name: "offset", schema: { type: "integer", default: 0  }, description: "Records to skip" },
];

// ── Admin warehouse routes ────────────────────────────────────────────────────

module.exports = {
    // ── Warehouses (admin) ───────────────────────────────────────────────────
    "/admin/warehouses": {
        get: {
            tags: [tag], summary: "List all warehouses", security,
            parameters: [
                ...paginationParams,
                { in: "query", name: "shop_id",   schema: { type: "integer" }, description: "Filter by shop" },
                { in: "query", name: "is_active",  schema: { type: "boolean" }, description: "Filter by active status" },
            ],
            responses: {
                200: {
                    description: "Paginated list of warehouses",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseList" } } },
                },
            },
        },
        post: {
            tags: [tag], summary: "Create a warehouse", security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseCreate" } } },
            },
            responses: {
                201: {
                    description: "Created warehouse",
                    content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Warehouse" } } } } },
                },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/warehouses/{id}": {
        get: {
            tags: [tag], summary: "Get a warehouse by ID", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: {
                    description: "Warehouse detail",
                    content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Warehouse" } } } } },
                },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: [tag], summary: "Update a warehouse", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseUpdate" } } },
            },
            responses: {
                200: { description: "Updated warehouse" },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: [tag], summary: "Delete a warehouse", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Deleted" },
                404: { description: "Not found" },
            },
        },
    },

    // ── Inventory (admin) ────────────────────────────────────────────────────
    "/admin/inventory": {
        get: {
            tags: [tag], summary: "List inventory levels", security,
            parameters: [
                ...paginationParams,
                { in: "query", name: "warehouse_id", schema: { type: "integer" }, description: "Filter by warehouse" },
                { in: "query", name: "product_id",   schema: { type: "integer" }, description: "Filter by product" },
            ],
            responses: {
                200: {
                    description: "Paginated inventory levels",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/InventoryLevelList" } } },
                },
            },
        },
        put: {
            tags: [tag], summary: "Upsert an inventory level (set absolute quantity)", security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/InventoryUpsert" } } },
            },
            responses: {
                200: {
                    description: "Inventory level after upsert",
                    content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/InventoryLevel" } } } } },
                },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/inventory/adjust": {
        post: {
            tags: [tag], summary: "Manual stock adjustment (INBOUND / ADJUSTMENT / RETURN / OUTBOUND)", security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/StockAdjust" } } },
            },
            responses: {
                200: {
                    description: "Updated inventory level",
                    content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/InventoryLevel" } } } } },
                },
                400: { description: "Validation error" },
            },
        },
    },

    // ── Stock movements (admin) ──────────────────────────────────────────────
    "/admin/stock-movements": {
        get: {
            tags: [tag], summary: "List stock movement history", security,
            parameters: [
                ...paginationParams,
                { in: "query", name: "warehouse_id", schema: { type: "integer" } },
                { in: "query", name: "product_id",   schema: { type: "integer" } },
                { in: "query", name: "order_id",     schema: { type: "integer" } },
                { in: "query", name: "type", schema: { type: "string", enum: ["INBOUND", "OUTBOUND", "ADJUSTMENT", "RETURN"] } },
            ],
            responses: {
                200: {
                    description: "Paginated movement log",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/StockMovementList" } } },
                },
            },
        },
    },

    // ── Seller warehouse routes ───────────────────────────────────────────────
    "/seller/warehouses": {
        get: {
            tags: ["Seller"], summary: "List my warehouses", security,
            parameters: paginationParams,
            responses: {
                200: {
                    description: "Paginated list of warehouses for the active shop",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseList" } } },
                },
            },
        },
        post: {
            tags: ["Seller"], summary: "Create a warehouse for my shop", security,
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseUpdate" } } },
            },
            responses: {
                201: { description: "Created warehouse" },
                400: { description: "Validation error" },
            },
        },
    },
    "/seller/warehouses/{id}": {
        get: {
            tags: ["Seller"], summary: "Get one of my warehouses", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Warehouse detail" },
                404: { description: "Not found or not owned by shop" },
            },
        },
        put: {
            tags: ["Seller"], summary: "Update one of my warehouses", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseUpdate" } } },
            },
            responses: {
                200: { description: "Updated warehouse" },
                404: { description: "Not found" },
            },
        },
        delete: {
            tags: ["Seller"], summary: "Delete one of my warehouses", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Deleted" },
                404: { description: "Not found" },
            },
        },
    },
    "/seller/warehouses/{id}/inventory": {
        get: {
            tags: ["Seller"], summary: "List inventory levels for a warehouse", security,
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "integer" } },
                ...paginationParams,
            ],
            responses: {
                200: {
                    description: "Paginated inventory levels",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/InventoryLevelList" } } },
                },
            },
        },
        put: {
            tags: ["Seller"], summary: "Upsert an inventory level for a warehouse", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["product_id", "quantity"],
                            properties: {
                                product_id: { type: "integer" },
                                variant_id: { type: "integer", nullable: true },
                                quantity:   { type: "integer", minimum: 0 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Updated inventory level" },
                404: { description: "Warehouse not found or not owned" },
            },
        },
    },
    "/seller/warehouses/{id}/inventory/adjust": {
        post: {
            tags: ["Seller"], summary: "Manual stock adjustment (INBOUND / ADJUSTMENT / RETURN only)", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["product_id", "quantity", "type"],
                            properties: {
                                product_id: { type: "integer" },
                                variant_id: { type: "integer", nullable: true },
                                quantity:   { type: "integer", minimum: 1 },
                                type:       { type: "string", enum: ["INBOUND", "ADJUSTMENT", "RETURN"] },
                                note:       { type: "string", nullable: true },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Updated inventory level" },
                400: { description: "Validation error or OUTBOUND type rejected" },
                404: { description: "Warehouse not found or not owned" },
            },
        },
    },
    "/seller/warehouses/{id}/movements": {
        get: {
            tags: ["Seller"], summary: "Stock movement history for a warehouse", security,
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "integer" } },
                ...paginationParams,
                { in: "query", name: "type", schema: { type: "string", enum: ["INBOUND", "OUTBOUND", "ADJUSTMENT", "RETURN"] } },
            ],
            responses: {
                200: {
                    description: "Paginated movement log",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/StockMovementList" } } },
                },
            },
        },
    },
};
