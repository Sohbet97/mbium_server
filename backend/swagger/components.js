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
                description_tm: { type: "string", nullable: true },
                description_ru: { type: "string", nullable: true },
                description_en: { type: "string", nullable: true },
                logo: { type: "string" },
                address: { type: "string" },
                location: { type: "string", nullable: true, description: "Human-readable address string" },
                coordinates: {
                    type: "object",
                    nullable: true,
                    properties: { lat: { type: "number" }, lng: { type: "number" } },
                },
                city_id: { type: "integer" },
                region_id: { type: "integer" },
                phone: { type: "string" },
                email: { type: "string" },
                status: { type: "integer" },
                is_active: { type: "boolean" },
                is_verified: { type: "boolean" },
                verification_status: { type: "integer", description: "0=draft, 1=pending, 2=verified, 3=rejected" },
                verification_note: { type: "string", nullable: true },
                rating: { type: "number", format: "float" },
                type: { $ref: "#/components/schemas/ShopType" },
                categories: { type: "array", items: { $ref: "#/components/schemas/Category" } },
            },
        },
        ShopRequest: {
            type: "object",
            required: ["type_id", "name"],
            properties: {
                owner_id: { type: "string", format: "uuid" },
                type_id: { type: "integer" },
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                description: { type: "string" },
                description_tm: { type: "string" },
                description_ru: { type: "string" },
                description_en: { type: "string" },
                logo: { type: "string" },
                address: { type: "string" },
                location: { type: "string" },
                coordinates: {
                    type: "object",
                    nullable: true,
                    properties: { lat: { type: "number" }, lng: { type: "number" } },
                },
                categories: { type: "array", items: { type: "integer" }, description: "Array of category IDs" },
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
                commission_rate: { type: "number", format: "float", example: 0.15, description: "Commission rate, e.g. 0.15 = 15%" },
                is_active: { type: "boolean" },
            },
        },
        ShopTypeRequest: {
            type: "object",
            required: ["name"],
            properties: {
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                commission_rate: { type: "number", format: "float", example: 0.15 },
                is_active: { type: "boolean" },
            },
        },

        // ── Deliver ───────────────────────────────────────────────────────────────
        Deliver: {
            type: "object",
            properties: {
                id: { type: "integer" },
                first_name: { type: "string" },
                last_name: { type: "string" },
                avatar: { type: "string", nullable: true },
                city_id: { type: "integer", nullable: true },
                status: { type: "integer", description: "0=offline, 1=online" },
                phones: { type: "array", items: { type: "string" }, example: ["+99361123456"] },
                city: { $ref: "#/components/schemas/City" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        DeliverRequest: {
            type: "object",
            required: ["first_name", "last_name"],
            properties: {
                first_name: { type: "string" },
                last_name: { type: "string" },
                avatar: { type: "string", nullable: true },
                city_id: { type: "integer", nullable: true },
                status: { type: "integer", enum: [0, 1], default: 0 },
                phones: { type: "array", items: { type: "string" } },
            },
        },
        City: {
            type: "object",
            properties: {
                id: { type: "integer" },
                name: { type: "string" },
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

        // ── Collection ───────────────────────────────────────────────────────────
        Collection: {
            type: "object",
            properties: {
                id: { type: "integer" },
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                description: { type: "string" },
                image_url: { type: "string", nullable: true },
                handle: { type: "string" },
                sort_order: { type: "integer" },
                is_active: { type: "boolean" },
                product_count: { type: "integer" },
                products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
            },
        },
        CollectionRequest: {
            type: "object",
            required: ["name"],
            properties: {
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                description: { type: "string" },
                image_url: { type: "string" },
                handle: { type: "string" },
                sort_order: { type: "integer" },
                is_active: { type: "boolean" },
            },
        },

        // ── ShopMember ────────────────────────────────────────────────────────────
        ShopMember: {
            type: "object",
            properties: {
                id: { type: "integer" },
                shop_id: { type: "integer" },
                user_id: { type: "string", format: "uuid" },
                role: { type: "string", enum: ["OWNER", "DIRECTOR", "MANAGER", "MODERATOR", "STAFF"] },
                is_active: { type: "boolean" },
                invited_by: { type: "string", format: "uuid", nullable: true },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        ShopMemberRequest: {
            type: "object",
            required: ["shop_id", "user_id", "role"],
            properties: {
                shop_id: { type: "integer" },
                user_id: { type: "string", format: "uuid" },
                role: { type: "string", enum: ["OWNER", "DIRECTOR", "MANAGER", "MODERATOR", "STAFF"] },
                is_active: { type: "boolean" },
            },
        },

        // ── Media ─────────────────────────────────────────────────────────────────
        Media: {
            type: "object",
            properties: {
                id: { type: "string", format: "uuid" },
                type: { type: "string", enum: ["image", "video", "3d", "360"] },
                url: { type: "string" },
                thumbnail_url: { type: "string", nullable: true },
                original_name: { type: "string" },
                alt_text: { type: "string", nullable: true },
                title: { type: "string", nullable: true },
                mime_type: { type: "string" },
                size: { type: "integer", description: "File size in bytes" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        ProductMedia: {
            type: "object",
            properties: {
                id: { type: "integer" },
                product_id: { type: "integer" },
                media_id: { type: "string", format: "uuid" },
                role: { type: "string", enum: ["primary", "gallery", "video", "3d", "360"] },
                sort_order: { type: "integer" },
                media: { $ref: "#/components/schemas/Media" },
            },
        },

        // ── Banner ────────────────────────────────────────────────────────────────
        BannerType: {
            type: "object",
            properties: {
                id: { type: "integer" },
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                slug: { type: "string", example: "home_hero" },
                description: { type: "string", nullable: true },
                is_active: { type: "boolean" },
            },
        },
        BannerTypeRequest: {
            type: "object",
            required: ["name", "slug"],
            properties: {
                name: { type: "string" },
                name_ru: { type: "string" },
                name_eng: { type: "string" },
                slug: { type: "string" },
                description: { type: "string" },
                is_active: { type: "boolean" },
            },
        },
        Banner: {
            type: "object",
            properties: {
                id: { type: "integer" },
                shop_id: { type: "integer", nullable: true },
                banner_type_id: { type: "integer", nullable: true },
                media_id: { type: "string", format: "uuid", nullable: true },
                title: { type: "string" },
                subtitle: { type: "string", nullable: true },
                link_url: { type: "string", nullable: true },
                button_text: { type: "string", nullable: true },
                button_url: { type: "string", nullable: true },
                sort_order: { type: "integer" },
                is_active: { type: "boolean" },
                starts_at: { type: "string", format: "date-time", nullable: true },
                ends_at: { type: "string", format: "date-time", nullable: true },
                bannerType: { $ref: "#/components/schemas/BannerType" },
                media: { $ref: "#/components/schemas/Media" },
            },
        },
        BannerRequest: {
            type: "object",
            required: ["title"],
            properties: {
                shop_id: { type: "integer", nullable: true },
                banner_type_id: { type: "integer" },
                media_id: { type: "string", format: "uuid", nullable: true },
                title: { type: "string" },
                subtitle: { type: "string" },
                link_url: { type: "string" },
                button_text: { type: "string" },
                button_url: { type: "string" },
                sort_order: { type: "integer" },
                is_active: { type: "boolean" },
                starts_at: { type: "string", format: "date-time" },
                ends_at: { type: "string", format: "date-time" },
            },
        },

        // ── Discount & Flash Sale ─────────────────────────────────────────────────
        Discount: {
            type: "object",
            properties: {
                id: { type: "integer" },
                shop_id: { type: "integer" },
                product_id: { type: "integer", nullable: true },
                code: { type: "string", nullable: true },
                type: { type: "string", enum: ["percentage", "fixed"] },
                value: { type: "number" },
                min_order_amount: { type: "number", nullable: true },
                max_uses: { type: "integer", nullable: true },
                used_count: { type: "integer" },
                starts_at: { type: "string", format: "date-time", nullable: true },
                ends_at: { type: "string", format: "date-time", nullable: true },
                is_active: { type: "boolean" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        DiscountRequest: {
            type: "object",
            required: ["shop_id", "type", "value"],
            properties: {
                shop_id: { type: "integer" },
                product_id: { type: "integer", nullable: true },
                code: { type: "string" },
                type: { type: "string", enum: ["percentage", "fixed"] },
                value: { type: "number" },
                min_order_amount: { type: "number" },
                max_uses: { type: "integer" },
                starts_at: { type: "string", format: "date-time" },
                ends_at: { type: "string", format: "date-time" },
                is_active: { type: "boolean" },
            },
        },
        FlashSale: {
            type: "object",
            properties: {
                id: { type: "integer" },
                shop_id: { type: "integer" },
                title: { type: "string" },
                discount_percent: { type: "number" },
                starts_at: { type: "string", format: "date-time" },
                ends_at: { type: "string", format: "date-time" },
                is_active: { type: "boolean" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        FlashSaleRequest: {
            type: "object",
            required: ["shop_id", "title", "discount_percent", "starts_at", "ends_at"],
            properties: {
                shop_id: { type: "integer" },
                title: { type: "string" },
                discount_percent: { type: "number", minimum: 0, maximum: 100 },
                starts_at: { type: "string", format: "date-time" },
                ends_at: { type: "string", format: "date-time" },
                is_active: { type: "boolean" },
            },
        },

        // ── Payout ────────────────────────────────────────────────────────────────
        PayoutRequest: {
            type: "object",
            properties: {
                id: { type: "integer" },
                shop_id: { type: "integer" },
                amount: { type: "number" },
                currency: { type: "string", example: "TMT" },
                status: { type: "integer", description: "0=pending, 1=approved, 2=rejected" },
                note: { type: "string", nullable: true },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        PayoutRequestBody: {
            type: "object",
            required: ["shop_id", "amount"],
            properties: {
                shop_id: { type: "integer" },
                amount: { type: "number", minimum: 0 },
                currency: { type: "string", default: "TMT" },
                note: { type: "string" },
            },
        },
        SellerBalance: {
            type: "object",
            properties: {
                shop_id: { type: "integer" },
                total_earned: { type: "number" },
                total_withdrawn: { type: "number" },
                available: { type: "number" },
                currency: { type: "string" },
            },
        },

        // ── Dispute ───────────────────────────────────────────────────────────────
        Dispute: {
            type: "object",
            properties: {
                id: { type: "integer" },
                order_id: { type: "integer" },
                user_id: { type: "string", format: "uuid" },
                reason: { type: "string" },
                status: { type: "integer", description: "0=open, 1=resolved, 2=rejected" },
                note: { type: "string", nullable: true },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        DisputeRequest: {
            type: "object",
            required: ["order_id", "reason"],
            properties: {
                order_id: { type: "integer" },
                reason: { type: "string" },
            },
        },

        // ── Shipment & Delivery Address ───────────────────────────────────────────
        Shipment: {
            type: "object",
            properties: {
                id: { type: "integer" },
                order_id: { type: "integer" },
                carrier: { type: "string", nullable: true },
                tracking_number: { type: "string", nullable: true },
                status: { type: "integer" },
                shipped_at: { type: "string", format: "date-time", nullable: true },
                delivered_at: { type: "string", format: "date-time", nullable: true },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        ShipmentRequest: {
            type: "object",
            properties: {
                carrier: { type: "string" },
                tracking_number: { type: "string" },
                status: { type: "integer" },
                shipped_at: { type: "string", format: "date-time" },
                delivered_at: { type: "string", format: "date-time" },
            },
        },
        DeliveryAddress: {
            type: "object",
            properties: {
                id: { type: "integer" },
                user_id: { type: "string", format: "uuid" },
                label: { type: "string", nullable: true },
                address: { type: "string" },
                city_id: { type: "integer", nullable: true },
                region_id: { type: "integer", nullable: true },
                coordinates: { type: "object", nullable: true, properties: { lat: { type: "number" }, lng: { type: "number" } } },
                is_default: { type: "boolean" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        DeliveryAddressRequest: {
            type: "object",
            required: ["address"],
            properties: {
                label: { type: "string" },
                address: { type: "string" },
                city_id: { type: "integer" },
                region_id: { type: "integer" },
                coordinates: { type: "object", properties: { lat: { type: "number" }, lng: { type: "number" } } },
                is_default: { type: "boolean" },
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

        // ── Plans & Subscriptions ─────────────────────────────────────────────────
        Plan: {
            type: "object",
            properties: {
                id:                   { type: "integer" },
                name:                 { type: "string", example: "basic" },
                display_name_tm:      { type: "string", nullable: true },
                display_name_ru:      { type: "string", nullable: true },
                display_name_en:      { type: "string", nullable: true },
                price_monthly:        { type: "number", example: 0 },
                commission_rate:      { type: "number", example: 0.15, description: "Decimal, e.g. 0.15 = 15%" },
                product_limit:        { type: "integer", nullable: true, description: "null = unlimited" },
                hotspot_per_month:    { type: "integer" },
                hotspot_duration_hrs: { type: "integer" },
                ai_credits_monthly:   { type: "integer" },
                auction_per_week:     { type: "integer", nullable: true },
                live_stream_mode:     { type: "integer", description: "0=none, 1=view-only, 2=limited, 3=unlimited" },
                ads_dashboard:        { type: "boolean" },
                coin_earn:            { type: "boolean" },
                coin_earn_priority:   { type: "boolean" },
                verified_badge:       { type: "boolean" },
                virtual_tour:         { type: "boolean" },
                oem_odm_support:      { type: "boolean" },
                revenue_share_user:   { type: "integer" },
                push_notif_monthly:   { type: "integer" },
                is_active:            { type: "boolean" },
                sort_order:           { type: "integer" },
                createdAt:            { type: "string", format: "date-time" },
            },
        },
        PlanRequest: {
            type: "object",
            required: ["name"],
            properties: {
                name:                 { type: "string" },
                display_name_tm:      { type: "string" },
                display_name_ru:      { type: "string" },
                display_name_en:      { type: "string" },
                price_monthly:        { type: "number" },
                commission_rate:      { type: "number" },
                product_limit:        { type: "integer", nullable: true },
                hotspot_per_month:    { type: "integer" },
                hotspot_duration_hrs: { type: "integer" },
                ai_credits_monthly:   { type: "integer" },
                auction_per_week:     { type: "integer", nullable: true },
                live_stream_mode:     { type: "integer" },
                ads_dashboard:        { type: "boolean" },
                coin_earn:            { type: "boolean" },
                coin_earn_priority:   { type: "boolean" },
                verified_badge:       { type: "boolean" },
                virtual_tour:         { type: "boolean" },
                oem_odm_support:      { type: "boolean" },
                revenue_share_user:   { type: "integer" },
                push_notif_monthly:   { type: "integer" },
                is_active:            { type: "boolean" },
                sort_order:           { type: "integer" },
            },
        },
        ShopSubscription: {
            type: "object",
            properties: {
                id:          { type: "integer" },
                shop_id:     { type: "integer" },
                plan_id:     { type: "integer" },
                status:      { type: "integer", description: "1=active, 2=cancelled, 3=expired" },
                starts_at:   { type: "string", format: "date-time" },
                ends_at:     { type: "string", format: "date-time", nullable: true, description: "null = no expiry" },
                note:        { type: "string", nullable: true },
                assigned_by: { type: "string", format: "uuid", nullable: true },
                shop:        { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } },
                plan:        { $ref: "#/components/schemas/Plan" },
                createdAt:   { type: "string", format: "date-time" },
            },
        },
        ShopSubscriptionRequest: {
            type: "object",
            required: ["shop_id", "plan_id"],
            properties: {
                shop_id:   { type: "integer" },
                plan_id:   { type: "integer" },
                starts_at: { type: "string", format: "date" },
                ends_at:   { type: "string", format: "date", nullable: true },
                note:      { type: "string" },
            },
        },

        // ── Notifications ─────────────────────────────────────────────────────────
        Notification: {
            type: "object",
            properties: {
                id:         { type: "integer" },
                user_id:    { type: "string", format: "uuid" },
                type:       { type: "string" },
                title:      { type: "string" },
                body:       { type: "string" },
                data:       { type: "object", nullable: true },
                is_read:    { type: "boolean" },
                createdAt:  { type: "string", format: "date-time" },
            },
        },

        // ── Locations ─────────────────────────────────────────────────────────────
        Country: {
            type: "object",
            properties: {
                id:   { type: "integer" },
                name: { type: "string" },
                code: { type: "string", nullable: true },
            },
        },
        Region: {
            type: "object",
            properties: {
                id:         { type: "integer" },
                name:       { type: "string" },
                country_id: { type: "integer", nullable: true },
            },
        },
        District: {
            type: "object",
            properties: {
                id:        { type: "integer" },
                name:      { type: "string" },
                region_id: { type: "integer", nullable: true },
            },
        },
        Village: {
            type: "object",
            properties: {
                id:          { type: "integer" },
                name:        { type: "string" },
                district_id: { type: "integer", nullable: true },
            },
        },

        // ── AI Recommendations ────────────────────────────────────────────────────
        AiRecommendation: {
            type: "object",
            properties: {
                id:          { type: "integer" },
                title_tk:    { type: "string" },
                title_ru:    { type: "string" },
                title_en:    { type: "string" },
                subtitle_tk: { type: "string", nullable: true },
                subtitle_ru: { type: "string", nullable: true },
                subtitle_en: { type: "string", nullable: true },
                emoji:       { type: "string", nullable: true, example: "🛍️" },
                prompt:      { type: "string", description: "Prompt sent to the AI when the card is tapped" },
                sort_order:  { type: "integer", default: 0 },
                is_active:   { type: "boolean", default: true },
                createdAt:   { type: "string", format: "date-time" },
                updatedAt:   { type: "string", format: "date-time" },
            },
        },
        AiRecommendationRequest: {
            type: "object",
            required: ["title_tk", "title_ru", "title_en", "prompt"],
            properties: {
                title_tk:    { type: "string" },
                title_ru:    { type: "string" },
                title_en:    { type: "string" },
                subtitle_tk: { type: "string" },
                subtitle_ru: { type: "string" },
                subtitle_en: { type: "string" },
                emoji:       { type: "string", example: "🛍️" },
                prompt:      { type: "string" },
                sort_order:  { type: "integer", default: 0 },
                is_active:   { type: "boolean", default: true },
            },
        },

        // ── Push Notifications ────────────────────────────────────────────────────
        PushNotificationCampaign: {
            type: "object",
            properties: {
                id:              { type: "integer", example: 1 },
                shop_id:         { type: "integer", nullable: true, description: "null for platform-wide admin blasts", example: 5 },
                created_by:      { type: "string", format: "uuid" },
                title:           { type: "string", example: "Big sale today!" },
                body:            { type: "string", example: "Get up to 50% off — today only." },
                image_url:       { type: "string", format: "uri", nullable: true },
                data:            { type: "object", nullable: true, additionalProperties: { type: "string" } },
                status:          { type: "integer", enum: [0, 1, 2], description: "0=pending, 1=sent, 2=failed" },
                recipient_count: { type: "integer", example: 1200 },
                success_count:   { type: "integer", example: 1185 },
                fail_count:      { type: "integer", example: 15 },
                sent_at:         { type: "string", format: "date-time", nullable: true },
                created_at:      { type: "string", format: "date-time" },
                shop: {
                    nullable: true,
                    type: "object",
                    properties: {
                        id:   { type: "integer" },
                        name: { type: "string" },
                    },
                },
                sender: {
                    nullable: true,
                    type: "object",
                    properties: {
                        id:      { type: "string", format: "uuid" },
                        name:    { type: "string" },
                        surname: { type: "string" },
                    },
                },
            },
        },
    },
};
