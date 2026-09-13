module.exports = {
    securitySchemes: {
        BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
        },
    },
    parameters: {
        XShopId: {
            in: "header",
            name: "X-Shop-Id",
            required: false,
            schema: { type: "string" },
            description: "Active shop ID to operate under. Required when the seller owns multiple shops. " +
                "The server verifies the shop belongs to the authenticated user. " +
                "If omitted, resolves to the first active shop automatically.",
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
                follower_count: { type: "integer" },
                type: { $ref: "#/components/schemas/ShopType" },
                categories: { type: "array", items: { $ref: "#/components/schemas/Category" } },
                deliveryTypes: { type: "array", items: { $ref: "#/components/schemas/DeliveryType" } },
                brands: { type: "array", items: { $ref: "#/components/schemas/Brand" } },
                plan: {
                    type: "object",
                    nullable: true,
                    properties: { id: { type: "integer" }, verified_badge: { type: "boolean" } },
                },
                has_blue_badge: { type: "boolean", description: "Computed: plan.verified_badge OR is_verified" },
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
                delivery_type_ids: { type: "array", items: { type: "integer" }, description: "Array of delivery type IDs" },
                brand_ids: { type: "array", items: { type: "integer" }, description: "Array of brand IDs" },
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
                image: { type: "string", nullable: true, description: "Category cover image URL" },
                order: { type: "integer" },
                seo_title: { type: "string", nullable: true },
                seo_description: { type: "string", nullable: true },
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
                image: { type: "string", nullable: true },
                order: { type: "integer" },
                seo_title: { type: "string" },
                seo_description: { type: "string" },
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
                color_hex: { type: "string", nullable: true, example: "#ef4444" },
                color: {
                    type: "object",
                    nullable: true,
                    properties: { id: { type: "integer" }, name: { type: "string" }, hex: { type: "string" } },
                },
                shop: {
                    type: "object",
                    properties: { id: { type: "integer" }, name: { type: "string" }, has_blue_badge: { type: "boolean" } },
                },
                category: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } },
                variants: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProductVariant" },
                    description: "Only present on the single-product detail endpoint (GET .../products/{id})",
                },
                priceTiers: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProductPriceTier" },
                    description: "Quantity-based unit-price schedule (e.g. buy 25+ for a lower unit price). Only present on the single-product detail endpoint. Ignored when a variant/size selected at purchase time has its own tiers or flat price — see ProductVariant.priceTiers.",
                },
                productMedia: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProductMedia" },
                    description: "Shared product-level images/video (variant_id=null, role != '3d'). Only present on the detail endpoint.",
                },
                models3d: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProductMedia" },
                    description: "Shared product-level 3D models (variant_id=null, role='3d') — kept separate from productMedia so image galleries don't need to filter them out. Only present on the detail endpoint.",
                },
                brand: {
                    allOf: [{ $ref: "#/components/schemas/Brand" }],
                    nullable: true,
                    description: "Only present on the single-product detail endpoint (GET .../products/{id})",
                },
                deliveryTypes: {
                    type: "array",
                    items: { $ref: "#/components/schemas/DeliveryType" },
                    description: "Only present on the single-product detail endpoint (GET .../products/{id})",
                },
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
                brand_id: { type: "integer", nullable: true },
                color_hex: { type: "string", nullable: true, example: "#ef4444", description: "Must match a hex in the `colors` palette" },
                delivery_type_ids: { type: "array", items: { type: "integer" }, description: "Array of delivery type IDs" },
                is_active: { type: "boolean" },
            },
        },
        ProductVariant: {
            type: "object",
            properties: {
                id: { type: "integer" },
                product_id: { type: "integer" },
                name: { type: "string" },
                sku: { type: "string", nullable: true },
                barcode: { type: "string", nullable: true },
                price: { type: "number", nullable: true },
                compare_at_price: { type: "number", nullable: true },
                stock: { type: "integer" },
                attributes: { type: "object", example: { color: "red" } },
                is_active: { type: "boolean" },
                sizes: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProductVariantSize" },
                    description: "Per-size stock/price rows nested under this variant (color/style)",
                },
                priceTiers: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProductPriceTier" },
                    description: "Quantity-based unit-price schedule for this variant. Takes precedence over the product's own price tiers when present; a selected size's flat price still wins over any tier.",
                },
                media: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProductMedia" },
                    description: "Media scoped to this variant only (variant_id set)",
                },
            },
        },
        ProductVariantSize: {
            type: "object",
            properties: {
                id: { type: "integer" },
                variant_id: { type: "integer" },
                size_id: { type: "integer" },
                sku: { type: "string", nullable: true },
                barcode: { type: "string", nullable: true },
                price: { type: "number", nullable: true, description: "Overrides variant/product price when set" },
                compare_at_price: { type: "number", nullable: true },
                stock: { type: "integer" },
                is_active: { type: "boolean" },
                size: { $ref: "#/components/schemas/Size" },
            },
        },
        ProductVariantSizeRequest: {
            type: "object",
            required: ["size_id"],
            properties: {
                size_id: { type: "integer" },
                sku: { type: "string", nullable: true },
                barcode: { type: "string", nullable: true },
                price: { type: "number", nullable: true },
                compare_at_price: { type: "number", nullable: true },
                stock: { type: "integer", default: 0 },
                is_active: { type: "boolean", default: true },
            },
        },
        ProductPriceTier: {
            type: "object",
            description: "One row of a quantity-based unit-price schedule, e.g. '25-99 units => 0.75 TMT/unit'. Belongs to exactly one owner — either a product or one of its variants, never both.",
            properties: {
                id: { type: "integer" },
                product_id: { type: "integer", nullable: true },
                variant_id: { type: "integer", nullable: true },
                min_qty: { type: "integer", example: 25 },
                max_qty: { type: "integer", nullable: true, example: 99, description: "null = open-ended (e.g. '100+')" },
                unit_price: { type: "number", example: 0.75 },
            },
        },
        ProductPriceTierRequest: {
            type: "object",
            required: ["min_qty", "unit_price"],
            properties: {
                min_qty: { type: "integer", minimum: 1, example: 25 },
                max_qty: { type: "integer", nullable: true, example: 99, description: "Omit or null for an open-ended top tier (e.g. '100+'). Must be greater than min_qty when set." },
                unit_price: { type: "number", minimum: 0, example: 0.75 },
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
                variant_size_id: { type: "integer", nullable: true, description: "Resolves price/stock at the per-size level when set" },
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
                variant_size_id: { type: "integer", nullable: true, description: "Resolves price/stock at the per-size level when set" },
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
                variant_id: { type: "integer", nullable: true, description: "null = shared product-level media; set = scoped to one variant (e.g. a color)" },
                role: { type: "string", enum: ["primary", "gallery", "video", "3d", "360", "spin"] },
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
                shop_id: { type: "integer", nullable: true },
                product_id: { type: "integer" },
                variant_id: { type: "integer", nullable: true },
                sale_price: { type: "number" },
                original_price: { type: "number" },
                quantity_limit: { type: "integer", nullable: true },
                sold_count: { type: "integer" },
                starts_at: { type: "string", format: "date-time", nullable: true },
                ends_at: { type: "string", format: "date-time", nullable: true },
                is_active: { type: "boolean" },
                createdAt: { type: "string", format: "date-time" },
            },
        },
        FlashSaleRequest: {
            type: "object",
            required: ["product_id", "sale_price", "original_price"],
            properties: {
                shop_id: { type: "integer", nullable: true },
                product_id: { type: "integer" },
                variant_id: { type: "integer", nullable: true },
                sale_price: { type: "number" },
                original_price: { type: "number" },
                quantity_limit: { type: "integer", nullable: true },
                starts_at: { type: "string", format: "date-time", nullable: true },
                ends_at: { type: "string", format: "date-time", nullable: true },
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
                available_balance: { type: "number" },
                pending_balance: { type: "number" },
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
                reel_monthly:         { type: "integer", nullable: true, description: "null = unlimited, 0 = not available" },
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
                reel_monthly:         { type: "integer", nullable: true, description: "null = unlimited, 0 = not available" },
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

        // ── Brand ─────────────────────────────────────────────────────────────────
        Color: {
            type: "object",
            properties: {
                id:         { type: "integer" },
                name:       { type: "string" },
                name_ru:    { type: "string", nullable: true },
                name_eng:   { type: "string", nullable: true },
                slug:       { type: "string" },
                hex:        { type: "string", example: "#ef4444", description: "Lower-case #rrggbb; unique, and what products/variants reference" },
                is_active:  { type: "boolean" },
                sort_order: { type: "integer" },
                createdAt:  { type: "string", format: "date-time" },
            },
        },
        ColorRequest: {
            type: "object",
            required: ["name", "hex"],
            properties: {
                name:       { type: "string" },
                name_ru:    { type: "string", nullable: true },
                name_eng:   { type: "string", nullable: true },
                slug:       { type: "string", description: "Derived from name when omitted" },
                hex:        { type: "string", example: "#ef4444", description: "#rgb or #rrggbb, with or without the leading #; normalised to lower-case #rrggbb" },
                is_active:  { type: "boolean", default: true },
                sort_order: { type: "integer", default: 0 },
            },
        },
        Brand: {
            type: "object",
            properties: {
                id:          { type: "integer" },
                name:        { type: "string" },
                name_ru:     { type: "string", nullable: true },
                name_en:     { type: "string", nullable: true },
                slug:        { type: "string" },
                parent_id:   { type: "integer", nullable: true },
                logo_url:    { type: "string", nullable: true },
                description: { type: "string", nullable: true },
                is_active:   { type: "boolean" },
                sort_order:  { type: "integer" },
                createdAt:   { type: "string", format: "date-time" },
            },
        },
        BrandTree: {
            allOf: [
                { $ref: "#/components/schemas/Brand" },
                { type: "object", properties: {
                    children: { type: "array", items: { $ref: "#/components/schemas/BrandTree" }, description: "Recursive sub-brands" },
                }},
            ],
        },
        BrandRequest: {
            type: "object",
            required: ["name"],
            properties: {
                name:        { type: "string" },
                name_ru:     { type: "string" },
                name_en:     { type: "string" },
                slug:        { type: "string", description: "Auto-generated from name if omitted" },
                parent_id:   { type: "integer", nullable: true },
                logo_url:    { type: "string" },
                description: { type: "string" },
                is_active:   { type: "boolean", default: true },
                sort_order:  { type: "integer", default: 0 },
            },
        },

        // ── Size ──────────────────────────────────────────────────────────────────
        Size: {
            type: "object",
            properties: {
                id:         { type: "integer" },
                name:       { type: "string" },
                name_ru:    { type: "string", nullable: true },
                name_eng:   { type: "string", nullable: true },
                slug:       { type: "string" },
                parent_id:  { type: "integer", nullable: true },
                is_active:  { type: "boolean" },
                sort_order: { type: "integer" },
                createdAt:  { type: "string", format: "date-time" },
            },
        },
        SizeTree: {
            allOf: [
                { $ref: "#/components/schemas/Size" },
                { type: "object", properties: {
                    children: { type: "array", items: { $ref: "#/components/schemas/SizeTree" }, description: "Recursive sub-sizes" },
                }},
            ],
        },
        SizeRequest: {
            type: "object",
            required: ["name"],
            properties: {
                name:       { type: "string" },
                name_ru:    { type: "string" },
                name_eng:   { type: "string" },
                slug:       { type: "string", description: "Auto-generated from name if omitted" },
                parent_id:  { type: "integer", nullable: true },
                is_active:  { type: "boolean", default: true },
                sort_order: { type: "integer", default: 0 },
            },
        },

        // ── DeliveryType ──────────────────────────────────────────────────────────
        DeliveryType: {
            type: "object",
            properties: {
                id:         { type: "integer" },
                name:       { type: "string" },
                name_ru:    { type: "string", nullable: true },
                name_en:    { type: "string", nullable: true },
                code:       { type: "string" },
                is_active:  { type: "boolean" },
                sort_order: { type: "integer" },
                createdAt:  { type: "string", format: "date-time" },
            },
        },
        DeliveryTypeRequest: {
            type: "object",
            required: ["name", "code"],
            properties: {
                name:       { type: "string" },
                name_ru:    { type: "string" },
                name_en:    { type: "string" },
                code:       { type: "string" },
                is_active:  { type: "boolean", default: true },
                sort_order: { type: "integer", default: 0 },
            },
        },

        // ── Supplier ──────────────────────────────────────────────────────────────
        Supplier: {
            type: "object",
            properties: {
                id:           { type: "integer" },
                name:         { type: "string" },
                contact_name: { type: "string", nullable: true },
                email:        { type: "string", format: "email", nullable: true },
                phone:        { type: "string", nullable: true },
                address:      { type: "string", nullable: true },
                country_id:   { type: "integer", nullable: true },
                website:      { type: "string", nullable: true },
                is_active:    { type: "boolean" },
                notes:        { type: "string", nullable: true },
                createdAt:    { type: "string", format: "date-time" },
            },
        },
        SupplierRequest: {
            type: "object",
            required: ["name"],
            properties: {
                name:         { type: "string" },
                contact_name: { type: "string" },
                email:        { type: "string", format: "email" },
                phone:        { type: "string" },
                address:      { type: "string" },
                country_id:   { type: "integer", nullable: true },
                website:      { type: "string" },
                is_active:    { type: "boolean", default: true },
                notes:        { type: "string" },
            },
        },

        // ── Comment ───────────────────────────────────────────────────────────────
        Comment: {
            type: "object",
            properties: {
                id:         { type: "integer" },
                product_id: { type: "integer" },
                user_id:    { type: "string", format: "uuid" },
                parent_id:  { type: "integer", nullable: true },
                body:       { type: "string" },
                status:     { type: "string", enum: ["pending", "approved", "rejected"] },
                author: {
                    type: "object",
                    nullable: true,
                    properties: {
                        id:      { type: "string", format: "uuid" },
                        name:    { type: "string" },
                        surname: { type: "string" },
                        thumbnail: { type: "string", nullable: true },
                    },
                },
                replies:    { type: "array", items: { $ref: "#/components/schemas/Comment" }, description: "Nested replies (approved only, buyer route)" },
                createdAt:  { type: "string", format: "date-time" },
            },
        },

        // ── KYC Document ──────────────────────────────────────────────────────────
        KycDocument: {
            type: "object",
            properties: {
                id:          { type: "integer" },
                shop_id:     { type: "integer" },
                type:        { type: "string", enum: ["PASSPORT", "TAX_ID", "BUSINESS_REG", "BANK_STATEMENT", "OTHER"] },
                file_url:    { type: "string", example: "/static/shop-docs/uuid-file.pdf" },
                status:      { type: "string", enum: ["pending", "approved", "rejected"] },
                note:        { type: "string", nullable: true, description: "Admin review note" },
                reviewed_by: { type: "string", format: "uuid", nullable: true },
                reviewed_at: { type: "string", format: "date-time", nullable: true },
                reviewer: {
                    type: "object",
                    nullable: true,
                    properties: {
                        id:      { type: "string", format: "uuid" },
                        name:    { type: "string" },
                        surname: { type: "string" },
                    },
                },
                createdAt:   { type: "string", format: "date-time" },
            },
        },
        KycDocumentRequest: {
            type: "object",
            required: ["type", "file_url"],
            properties: {
                type:     { type: "string", enum: ["PASSPORT", "TAX_ID", "BUSINESS_REG", "BANK_STATEMENT", "OTHER"] },
                file_url: { type: "string", description: "URL returned by the /upload endpoint" },
                note:     { type: "string", nullable: true },
            },
        },

        // ── Buyer Request ─────────────────────────────────────────────────────────
        BuyerRequestAttachment: {
            type: "object",
            properties: {
                id:               { type: "integer" },
                buyer_request_id: { type: "integer" },
                url:              { type: "string" },
                file_type:        { type: "string", enum: ["IMAGE", "VIDEO", "EXCEL", "WORD", "PDF"] },
                mime_type:        { type: "string", nullable: true },
                original_name:    { type: "string", nullable: true },
                size:             { type: "integer", nullable: true, description: "Bytes" },
                createdAt:        { type: "string", format: "date-time" },
            },
        },
        BuyerRequestAttachmentInput: {
            type: "object",
            required: ["url"],
            description: "Points at a file already uploaded via POST /buyer/requests/attachments/upload (buyer) or POST /seller/buyer-requests/attachments/upload (seller). `file_type` is inferred from `mime_type`/the URL extension when omitted.",
            properties: {
                url:           { type: "string", description: "URL of the already-uploaded file" },
                file_type:     { type: "string", enum: ["IMAGE", "VIDEO", "EXCEL", "WORD", "PDF"], nullable: true },
                mime_type:     { type: "string", nullable: true },
                original_name: { type: "string", nullable: true },
                size:          { type: "integer", nullable: true, description: "Bytes" },
            },
        },
        BuyerRequest: {
            type: "object",
            properties: {
                id:         { type: "integer" },
                user_id:    { type: "string", format: "uuid" },
                city_id:    { type: "integer", nullable: true },
                product_id: { type: "integer", nullable: true, description: "Set for a shop-targeted (ÖTS) request" },
                shop_id:    { type: "integer", nullable: true, description: "Set for a shop-targeted (ÖTS) request" },
                text:        { type: "string",  nullable: true },
                attachments: { type: "array", items: { $ref: "#/components/schemas/BuyerRequestAttachment" } },
                budget:    { type: "number",  nullable: true, description: "Max budget in TMT" },
                quantity:  { type: "integer", default: 1 },
                status:    { type: "integer", enum: [0, 1], description: "0=active, 1=closed" },
                createdAt: { type: "string", format: "date-time" },
                user:      { type: "object", nullable: true, properties: { id: { type: "string" }, name: { type: "string" }, surname: { type: "string" } } },
                city:      { type: "object", nullable: true, properties: { id: { type: "integer" }, name: { type: "string" } } },
            },
        },
        BuyerRequestCreate: {
            type: "object",
            description: "At least one of `text` or `attachments` must be provided.",
            properties: {
                text:        { type: "string",  nullable: true, description: "What the buyer needs (free text)" },
                attachments: { type: "array", items: { $ref: "#/components/schemas/BuyerRequestAttachmentInput" }, description: "Image/video/excel/word/pdf files, already uploaded elsewhere" },
                city_id:    { type: "integer", nullable: true, description: "City to scope which shops are notified" },
                product_id: { type: "integer", nullable: true, description: "ÖTS: target one product (requires shop_id)" },
                shop_id:    { type: "integer", nullable: true, description: "ÖTS: target one shop instead of city-broadcast" },
                budget:     { type: "number",  nullable: true, description: "Max budget in TMT" },
                quantity:   { type: "integer", default: 1 },
            },
        },

        // ── ÖTS (Öz teklibiňi saýla) — offer negotiation ───────────────────────────
        BuyerRequestOfferAttachment: {
            type: "object",
            properties: {
                id:                      { type: "integer" },
                buyer_request_offer_id:  { type: "integer" },
                url:                     { type: "string" },
                file_type:               { type: "string", enum: ["IMAGE", "VIDEO", "EXCEL", "WORD", "PDF"] },
                mime_type:               { type: "string", nullable: true },
                original_name:           { type: "string", nullable: true },
                size:                    { type: "integer", nullable: true, description: "Bytes" },
                createdAt:               { type: "string", format: "date-time" },
            },
        },
        BuyerRequestOffer: {
            type: "object",
            properties: {
                id:                { type: "integer" },
                buyer_request_id:  { type: "integer" },
                shop_id:           { type: "integer" },
                product_id:        { type: "integer", nullable: true },
                variant_id:        { type: "integer", nullable: true },
                variant_size_id:   { type: "integer", nullable: true },
                parent_offer_id:   { type: "integer", nullable: true },
                from_role:         { type: "string", enum: ["SELLER", "BUYER"] },
                unit_price:        { type: "number" },
                quantity:          { type: "integer" },
                currency:          { type: "string", default: "TMT" },
                note:              { type: "string", nullable: true },
                attachments:       { type: "array", items: { $ref: "#/components/schemas/BuyerRequestOfferAttachment" } },
                status:            { type: "string", enum: ["PENDING", "COUNTERED", "ACCEPTED", "REJECTED", "EXPIRED"] },
                expires_at:        { type: "string", format: "date-time", nullable: true },
                consumed_at:       { type: "string", format: "date-time", nullable: true },
                consumed_order_id: { type: "integer", nullable: true },
                createdAt:         { type: "string", format: "date-time" },
            },
        },
        BuyerRequestOfferCreate: {
            type: "object",
            required: ["unit_price"],
            properties: {
                product_id:      { type: "integer", nullable: true },
                variant_id:      { type: "integer", nullable: true },
                variant_size_id: { type: "integer", nullable: true },
                unit_price:      { type: "number" },
                quantity:        { type: "integer", default: 1 },
                currency:        { type: "string", default: "TMT" },
                note:            { type: "string", nullable: true },
                expires_at:      { type: "string", format: "date-time", nullable: true },
                attachments:     { type: "array", items: { $ref: "#/components/schemas/BuyerRequestAttachmentInput" } },
            },
        },
        BuyerRequestOfferCounter: {
            type: "object",
            required: ["unit_price"],
            properties: {
                unit_price:  { type: "number" },
                quantity:    { type: "integer", nullable: true },
                note:        { type: "string", nullable: true },
                expires_at:  { type: "string", format: "date-time", nullable: true },
                attachments: { type: "array", items: { $ref: "#/components/schemas/BuyerRequestAttachmentInput" } },
            },
        },

        // ── Reel ──────────────────────────────────────────────────────────────────
        Reel: {
            type: "object",
            properties: {
                id:         { type: "integer" },
                shop_id:    { type: "integer" },
                caption:    { type: "string", nullable: true },
                view_count: { type: "integer" },
                like_count: { type: "integer" },
                share_count: { type: "integer" },
                gift_count: { type: "integer" },
                gift_coin_total: { type: "integer" },
                is_active:  { type: "boolean" },
                product_id: { type: "integer", nullable: true },
                moderation_status: { type: "integer", enum: [0, 1, 2], description: "0=PENDING, 1=APPROVED, 2=REJECTED" },
                moderation_note:   { type: "string", nullable: true },
                moderated_at:      { type: "string", format: "date-time", nullable: true },
                createdAt:  { type: "string", format: "date-time" },
                video: {
                    type: "object",
                    properties: {
                        id:        { type: "string", format: "uuid" },
                        url:       { type: "string" },
                        mime_type: { type: "string" },
                        size:      { type: "integer", description: "File size in bytes" },
                    },
                },
                thumbnail: {
                    type: "object",
                    nullable: true,
                    properties: {
                        id:            { type: "string", format: "uuid" },
                        url:           { type: "string" },
                        thumbnail_url: { type: "string", nullable: true },
                    },
                },
                shop: {
                    type: "object",
                    properties: {
                        id:   { type: "integer" },
                        name: { type: "string" },
                        logo: { type: "string", nullable: true },
                    },
                },
                product: {
                    type: "object",
                    nullable: true,
                    properties: {
                        id:       { type: "integer" },
                        name:     { type: "string" },
                        price:    { type: "number" },
                        currency: { type: "string", example: "TMT" },
                    },
                },
            },
        },
        ReelCreateRequest: {
            type: "object",
            required: ["video_id"],
            properties: {
                video_id:     { type: "string", format: "uuid", description: "Media ID of the uploaded video (must be type=video)" },
                thumbnail_id: { type: "string", format: "uuid", nullable: true, description: "Media ID of a cover image (optional but recommended)" },
                caption:      { type: "string", nullable: true, description: "Caption displayed below the reel" },
                product_id:   { type: "integer", nullable: true, description: "Link to one of your shop's products (optional)" },
            },
        },
        AdminReelCreateRequest: {
            type: "object",
            required: ["shop_id", "video_id"],
            properties: {
                shop_id:      { type: "integer", description: "Shop this reel belongs to" },
                video_id:     { type: "string", format: "uuid", description: "Media ID of the uploaded video (must be type=video)" },
                thumbnail_id: { type: "string", format: "uuid", nullable: true, description: "Media ID of a cover image (optional but recommended)" },
                caption:      { type: "string", nullable: true, description: "Caption displayed below the reel" },
                product_id:   { type: "integer", nullable: true, description: "Link to one of the shop's products (optional)" },
                moderation_status: { type: "integer", enum: [0, 1, 2], description: "Defaults to 1 (APPROVED) when omitted — admin-created reels don't need self-review" },
            },
        },
        ReelRejectRequest: {
            type: "object",
            properties: {
                note: { type: "string", nullable: true, description: "Reason shown to the seller" },
            },
        },
        ReelUpdateRequest: {
            type: "object",
            properties: {
                thumbnail_id: { type: "string", format: "uuid", nullable: true },
                caption:      { type: "string", nullable: true },
                product_id:   { type: "integer", nullable: true },
                is_active:    { type: "boolean" },
            },
        },

        // ── Gift Creators & Gift Types ──────────────────────────────────────────────
        GiftCreator: {
            type: "object",
            properties: {
                id:           { type: "integer" },
                name:         { type: "string" },
                contact_note: { type: "string", nullable: true },
                is_active:    { type: "boolean" },
                avatar: {
                    type: "object", nullable: true,
                    properties: { id: { type: "string", format: "uuid" }, url: { type: "string" } },
                },
                balance: { "$ref": "#/components/schemas/GiftCreatorBalance" },
            },
        },
        GiftCreatorCreateRequest: {
            type: "object",
            required: ["name"],
            properties: {
                name:         { type: "string" },
                avatar_id:    { type: "string", format: "uuid", nullable: true },
                contact_note: { type: "string", nullable: true },
            },
        },
        GiftCreatorBalance: {
            type: "object",
            properties: {
                gift_creator_id:   { type: "integer" },
                available_balance: { type: "number", example: 70.00 },
                currency:          { type: "string", example: "TMT" },
            },
        },
        GiftCreatorTransaction: {
            type: "object",
            properties: {
                id:              { type: "integer" },
                gift_creator_id: { type: "integer" },
                type:            { type: "string", enum: ["GIFT_CREDIT", "COMMISSION"] },
                amount:          { type: "number", description: "Positive = credit; COMMISSION rows are negative and audit-only" },
                status:          { type: "string", example: "AVAILABLE" },
                balance_after:   { type: "number", nullable: true },
                reference_id:    { type: "integer", nullable: true, description: "The reel a gift was sent on" },
                note:            { type: "string", nullable: true },
                createdAt:       { type: "string", format: "date-time" },
            },
        },
        GiftType: {
            type: "object",
            properties: {
                id:                 { type: "integer" },
                name:               { type: "string" },
                price_coin:         { type: "integer" },
                price_tmt:          { type: "number" },
                effect_description: { type: "string", nullable: true },
                sort_order:         { type: "integer" },
                is_active:          { type: "boolean" },
                animation: {
                    type: "object",
                    properties: { id: { type: "string", format: "uuid" }, url: { type: "string" }, mime_type: { type: "string" } },
                },
                icon: {
                    type: "object", nullable: true,
                    properties: { id: { type: "string", format: "uuid" }, url: { type: "string" } },
                },
                gift_creator: { "$ref": "#/components/schemas/GiftCreator" },
            },
        },
        GiftTypeCreateRequest: {
            type: "object",
            required: ["name", "animation_id", "price_coin", "price_tmt", "gift_creator_id"],
            properties: {
                name:                { type: "string" },
                animation_id:        { type: "string", format: "uuid", description: "Media ID of an uploaded GIF; reclassified to type='gift'" },
                icon_id:             { type: "string", format: "uuid", nullable: true },
                effect_description:  { type: "string", nullable: true },
                price_coin:          { type: "integer" },
                price_tmt:           { type: "number" },
                gift_creator_id:     { type: "integer" },
                sort_order:          { type: "integer" },
            },
        },
        ReelGift: {
            type: "object",
            properties: {
                id:         { type: "integer" },
                reel_id:    { type: "integer" },
                price_coin: { type: "integer" },
                price_tmt:  { type: "number" },
                message:    { type: "string", nullable: true },
                createdAt:  { type: "string", format: "date-time" },
                user: {
                    type: "object",
                    properties: { id: { type: "string", format: "uuid" }, name: { type: "string" }, surname: { type: "string" } },
                },
                gift_type: { "$ref": "#/components/schemas/GiftType" },
            },
        },
        ReelGiftSendRequest: {
            type: "object",
            required: ["gift_type_id"],
            properties: {
                gift_type_id: { type: "integer" },
                message:      { type: "string", maxLength: 200, nullable: true },
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
        // ── Analytics ─────────────────────────────────────────────────────────────
        AnalyticsOverview: {
            type: "object",
            properties: {
                summary: {
                    type: "object",
                    properties: {
                        total_revenue: { type: "number" },
                        total_orders:  { type: "integer" },
                        total_users:   { type: "integer" },
                        total_shops:   { type: "integer" },
                    },
                },
                revenue_series: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            period:  { type: "string", format: "date-time" },
                            revenue: { type: "number" },
                            orders:  { type: "integer" },
                        },
                    },
                },
            },
        },
        AnalyticsShops: {
            type: "object",
            properties: {
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id:      { type: "integer" },
                            name:    { type: "string" },
                            revenue: { type: "number" },
                            orders:  { type: "integer" },
                        },
                    },
                },
            },
        },
        AnalyticsUsers: {
            type: "object",
            properties: {
                series: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            period:    { type: "string", format: "date-time" },
                            new_users: { type: "integer" },
                        },
                    },
                },
            },
        },
        AnalyticsOrders: {
            type: "object",
            properties: {
                by_status: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            status: { type: "integer" },
                            count:  { type: "integer" },
                        },
                    },
                },
            },
        },

        // ── Warehouse management ───────────────────────────────────────────────
        Warehouse: {
            type: "object",
            properties: {
                id:            { type: "integer", example: 1 },
                shop_id:       { type: "integer", example: 3 },
                name:          { type: "string", example: "TeknoMart Merkezi Ammar" },
                city:          { type: "string", nullable: true, example: "Aşgabat" },
                address:       { type: "string", nullable: true, example: "Magtymguly şaýoly 89" },
                contact_phone: { type: "string", nullable: true, example: "61123456" },
                is_active:     { type: "boolean", example: true },
                is_default:    { type: "boolean", description: "Stock is auto-deducted from this warehouse on order PROCESSING", example: true },
                createdAt:     { type: "string", format: "date-time" },
                updatedAt:     { type: "string", format: "date-time" },
                shop: {
                    nullable: true,
                    type: "object",
                    properties: {
                        id:   { type: "integer" },
                        name: { type: "string" },
                    },
                },
            },
        },
        WarehouseList: {
            type: "object",
            properties: {
                data:  { type: "array", items: { $ref: "#/components/schemas/Warehouse" } },
                count: { type: "integer", example: 5 },
            },
        },
        WarehouseCreate: {
            type: "object",
            required: ["shop_id", "name"],
            properties: {
                shop_id:       { type: "integer", example: 3 },
                name:          { type: "string", example: "Merkezi Ammar" },
                city:          { type: "string", nullable: true, example: "Aşgabat" },
                address:       { type: "string", nullable: true },
                contact_phone: { type: "string", nullable: true },
                is_active:     { type: "boolean", default: true },
                is_default:    { type: "boolean", default: false },
            },
        },
        WarehouseUpdate: {
            type: "object",
            properties: {
                name:          { type: "string" },
                city:          { type: "string", nullable: true },
                address:       { type: "string", nullable: true },
                contact_phone: { type: "string", nullable: true },
                is_active:     { type: "boolean" },
                is_default:    { type: "boolean" },
            },
        },
        InventoryLevel: {
            type: "object",
            properties: {
                id:           { type: "integer" },
                warehouse_id: { type: "integer" },
                product_id:   { type: "integer" },
                variant_id:   { type: "integer", nullable: true },
                quantity:     { type: "integer", description: "Current stock at this warehouse", example: 42 },
                reserved:     { type: "integer", description: "Reserved for pending orders", example: 0 },
                updatedAt:    { type: "string", format: "date-time" },
                product: {
                    nullable: true,
                    type: "object",
                    properties: {
                        id:   { type: "integer" },
                        name: { type: "string" },
                    },
                },
                variant: {
                    nullable: true,
                    type: "object",
                    properties: {
                        id:   { type: "integer" },
                        name: { type: "string" },
                    },
                },
            },
        },
        InventoryLevelList: {
            type: "object",
            properties: {
                data:  { type: "array", items: { $ref: "#/components/schemas/InventoryLevel" } },
                count: { type: "integer" },
            },
        },
        InventoryUpsert: {
            type: "object",
            required: ["warehouse_id", "product_id", "quantity"],
            properties: {
                warehouse_id: { type: "integer" },
                product_id:   { type: "integer" },
                variant_id:   { type: "integer", nullable: true },
                quantity:     { type: "integer", minimum: 0, example: 100 },
            },
        },
        StockAdjust: {
            type: "object",
            required: ["warehouse_id", "product_id", "quantity", "type"],
            properties: {
                warehouse_id: { type: "integer" },
                product_id:   { type: "integer" },
                variant_id:   { type: "integer", nullable: true },
                quantity:     { type: "integer", minimum: 1, example: 10 },
                type:         { type: "string", enum: ["INBOUND", "OUTBOUND", "ADJUSTMENT", "RETURN"], example: "INBOUND" },
                note:         { type: "string", nullable: true, example: "Supplier delivery #INV-2024-001" },
            },
        },
        StockMovement: {
            type: "object",
            properties: {
                id:              { type: "integer" },
                warehouse_id:    { type: "integer" },
                product_id:      { type: "integer" },
                variant_id:      { type: "integer", nullable: true },
                order_id:        { type: "integer", nullable: true },
                type:            { type: "string", enum: ["INBOUND", "OUTBOUND", "ADJUSTMENT", "RETURN"] },
                quantity:        { type: "integer", description: "Always positive; direction indicated by type" },
                quantity_before: { type: "integer", description: "Snapshot before movement" },
                quantity_after:  { type: "integer", description: "Snapshot after movement" },
                note:            { type: "string", nullable: true },
                created_by:      { type: "string", format: "uuid", nullable: true },
                createdAt:       { type: "string", format: "date-time" },
                product: {
                    nullable: true,
                    type: "object",
                    properties: { id: { type: "integer" }, name: { type: "string" } },
                },
                variant: {
                    nullable: true,
                    type: "object",
                    properties: { id: { type: "integer" }, name: { type: "string" } },
                },
                warehouse: {
                    nullable: true,
                    type: "object",
                    properties: { id: { type: "integer" }, name: { type: "string" } },
                },
            },
        },
        StockMovementList: {
            type: "object",
            properties: {
                data:  { type: "array", items: { $ref: "#/components/schemas/StockMovement" } },
                count: { type: "integer" },
            },
        },
    },
};
