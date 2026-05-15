module.exports = {
    securitySchemes: {
        BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
        },
    },
    schemas: {
        // ── Common ────────────────────────────────────────────────────────────────
        ErrorResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                errors: { type: "array", items: { type: "string" } },
            },
        },
        PaginatedResponse: {
            type: "object",
            properties: {
                data: { type: "array", items: {} },
                count: { type: "integer" },
            },
        },

        // ── Auth ─────────────────────────────────────────────────────────────────
        LoginRequest: {
            type: "object",
            required: ["phone_number", "password"],
            properties: {
                phone_number: { type: "string", example: "61123456" },
                password: { type: "string", example: "secret123" },
            },
        },
        GoogleLoginRequest: {
            type: "object",
            required: ["id_token"],
            properties: {
                id_token: {
                    type: "string",
                    description: "Google ID token (`credential`) returned by Google Identity Services after the user signs in",
                    example: "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
                },
            },
        },
        RegisterRequest: {
            type: "object",
            required: ["phone_number", "password", "name"],
            properties: {
                name: { type: "string", example: "Dovlet" },
                surname: { type: "string", example: "Muhammedov" },
                phone_number: { type: "string", example: "61123456" },
                email: { type: "string", format: "email" },
                password: { type: "string" },
                birth_date: { type: "string", format: "date" },
            },
        },
        AuthResponse: {
            type: "object",
            properties: {
                accessToken: { type: "string" },
                refreshToken: { type: "string" },
                user: { $ref: "#/components/schemas/UserShort" },
            },
        },

        // ── User ─────────────────────────────────────────────────────────────────
        UserShort: {
            type: "object",
            properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                surname: { type: "string" },
                phone_number: { type: "string" },
                role_id: { type: "integer" },
                status: { type: "integer" },
            },
        },
        User: {
            type: "object",
            properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                surname: { type: "string" },
                phone_number: { type: "string" },
                email: { type: "string", format: "email" },
                birth_date: { type: "string", format: "date" },
                role_id: { type: "integer" },
                status: { type: "integer", description: "0=not activated, 1=active, 90=blocked" },
                last_login_date: { type: "string", format: "date-time" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        UserCreateRequest: {
            type: "object",
            required: ["name", "phone_number", "password"],
            properties: {
                name: { type: "string" },
                surname: { type: "string" },
                phone_number: { type: "string" },
                email: { type: "string", format: "email" },
                password: { type: "string" },
                birth_date: { type: "string", format: "date" },
                role_id: { type: "integer" },
                status: { type: "integer" },
            },
        },

        // ── Role ─────────────────────────────────────────────────────────────────
        Role: {
            type: "object",
            properties: {
                id: { type: "integer" },
                name: { type: "string" },
                permissions: { type: "array", items: { type: "integer" } },
                modules: { type: "array", items: { type: "integer" } },
                start_page: { type: "integer" },
                status: { type: "integer" },
            },
        },

        // ── Shop ─────────────────────────────────────────────────────────────────
        Shop: {
            type: "object",
            properties: {
                id: { type: "integer" },
                owner_id: { type: "string", format: "uuid" },
                type_id: { type: "integer" },
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                description: { type: "string" },
                logo: { type: "string" },
                address: { type: "string" },
                city_id: { type: "integer" },
                region_id: { type: "integer" },
                phone: { type: "string" },
                email: { type: "string" },
                status: { type: "integer" },
                is_active: { type: "boolean" },
                is_verified: { type: "boolean" },
                rating: { type: "number", format: "float" },
            },
        },
        ShopRequest: {
            type: "object",
            required: ["owner_id", "type_id", "name"],
            properties: {
                owner_id: { type: "string", format: "uuid" },
                type_id: { type: "integer" },
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                description: { type: "string" },
                logo: { type: "string" },
                address: { type: "string" },
                city_id: { type: "integer" },
                region_id: { type: "integer" },
                phone: { type: "string" },
                email: { type: "string" },
                is_active: { type: "boolean" },
            },
        },
        ShopType: {
            type: "object",
            properties: {
                id: { type: "integer" },
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                status: { type: "integer" },
            },
        },

        // ── Category ─────────────────────────────────────────────────────────────
        Category: {
            type: "object",
            properties: {
                id: { type: "integer" },
                parent_id: { type: "integer", nullable: true },
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                slug: { type: "string" },
                icon: { type: "string" },
                order: { type: "integer" },
                status: { type: "integer" },
            },
        },
        CategoryRequest: {
            type: "object",
            required: ["name", "slug"],
            properties: {
                parent_id: { type: "integer", nullable: true },
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                slug: { type: "string" },
                icon: { type: "string" },
                order: { type: "integer" },
                status: { type: "integer" },
            },
        },

        // ── Product ──────────────────────────────────────────────────────────────
        Product: {
            type: "object",
            properties: {
                id: { type: "integer" },
                shop_id: { type: "integer" },
                category_id: { type: "integer" },
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                description: { type: "string" },
                price: { type: "number", format: "float" },
                currency: { type: "string", example: "TMT" },
                sku: { type: "string" },
                stock: { type: "integer" },
                rating: { type: "number", format: "float" },
                review_count: { type: "integer" },
                status: { type: "integer" },
                is_active: { type: "boolean" },
            },
        },
        ProductRequest: {
            type: "object",
            required: ["shop_id", "category_id", "name", "price"],
            properties: {
                shop_id: { type: "integer" },
                category_id: { type: "integer" },
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                description: { type: "string" },
                price: { type: "number" },
                currency: { type: "string" },
                sku: { type: "string" },
                stock: { type: "integer" },
                is_active: { type: "boolean" },
            },
        },
        ProductVariant: {
            type: "object",
            properties: {
                id: { type: "integer" },
                product_id: { type: "integer" },
                name: { type: "string" },
                sku: { type: "string" },
                price: { type: "number", nullable: true },
                stock: { type: "integer" },
                attributes: { type: "object", example: { color: "red", size: "M" } },
                is_active: { type: "boolean" },
            },
        },
        ProductImage: {
            type: "object",
            properties: {
                id: { type: "integer" },
                product_id: { type: "integer" },
                url: { type: "string" },
                is_primary: { type: "boolean" },
                order: { type: "integer" },
            },
        },

        // ── Order ────────────────────────────────────────────────────────────────
        OrderItem: {
            type: "object",
            properties: {
                product_id: { type: "integer" },
                variant_id: { type: "integer", nullable: true },
                quantity: { type: "integer", minimum: 1 },
            },
        },
        OrderRequest: {
            type: "object",
            required: ["shop_id", "items"],
            properties: {
                shop_id: { type: "integer" },
                delivery_address: { type: "string" },
                note: { type: "string" },
                items: {
                    type: "array",
                    items: { $ref: "#/components/schemas/OrderItem" },
                    minItems: 1,
                },
            },
        },
        Order: {
            type: "object",
            properties: {
                id: { type: "integer" },
                user_id: { type: "string", format: "uuid" },
                shop_id: { type: "integer" },
                status: { type: "integer", description: "0=pending,1=confirmed,2=processing,3=shipped,4=delivered,10=cancelled" },
                total_price: { type: "number" },
                currency: { type: "string" },
                delivery_address: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        CartItemRequest: {
            type: "object",
            required: ["product_id", "quantity"],
            properties: {
                product_id: { type: "integer" },
                variant_id: { type: "integer", nullable: true },
                quantity: { type: "integer", minimum: 1 },
            },
        },

        // ── Review ───────────────────────────────────────────────────────────────
        Review: {
            type: "object",
            properties: {
                id: { type: "integer" },
                user_id: { type: "string", format: "uuid" },
                product_id: { type: "integer" },
                order_id: { type: "integer", nullable: true },
                rating: { type: "integer", minimum: 1, maximum: 5 },
                comment: { type: "string" },
                status: { type: "integer" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        ReviewRequest: {
            type: "object",
            required: ["product_id", "rating"],
            properties: {
                product_id: { type: "integer" },
                order_id: { type: "integer", nullable: true },
                rating: { type: "integer", minimum: 1, maximum: 5 },
                comment: { type: "string" },
            },
        },
    },
};
