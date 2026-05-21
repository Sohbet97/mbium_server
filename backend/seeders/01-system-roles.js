/**
 * Seeder: system roles (admin, moderator, content_manager, delivery_manager)
 *
 * Idempotent — safe to run multiple times.
 * Superadmin role is handled separately in 00-superadmin.js.
 */

const ROLES = [
    {
        slug: 'admin',
        name: 'Admin',
        // All permissions except ROLE_DELETE(4) and USER_LOGIN_AS(309)
        permissions: [
            1, 2, 3,           // Roles (no delete)
            5, 6, 7, 8,        // Users
            9, 10, 11, 12,     // Positions
            13, 14, 15, 16,    // Regions
            17, 18, 19, 20,    // Villages
            21, 22, 23, 24,    // Countries
            25, 26, 27, 28,    // Categories
            29, 30, 31, 32,    // Products
            33, 34, 35, 36,    // Orders
            37, 38, 39, 40,    // Reviews
            41, 42, 43, 44,    // Discounts
            45, 46, 47, 48,    // Banners
            49, 50, 51, 52,    // Shop Members
            53, 54, 55, 56,    // Payouts
            57, 58, 59, 60,    // Collections
            61, 62, 63, 64,    // Media
            65, 66, 67, 68,    // Disputes
            69, 70, 71, 72,    // Delivers
            73, 74, 75, 76,    // Plans
            77, 78, 79, 80,    // Subscriptions
            81, 82, 83, 84,    // Shops
            85, 86, 87, 88,    // AI Recommendations
        ],
        order: 1,
    },
    {
        slug: 'moderator',
        name: 'Moderator',
        permissions: [
            29,                // PRODUCT_GET
            33,                // ORDER_GET
            37, 38, 39, 40,   // Reviews (full)
            65, 66, 67, 68,   // Disputes (full)
            81,                // SHOP_GET
        ],
        order: 2,
    },
    {
        slug: 'content_manager',
        name: 'Content Manager',
        permissions: [
            25, 26, 27, 28,   // Categories
            29, 30, 31, 32,   // Products
            45, 46, 47, 48,   // Banners
            57, 58, 59, 60,   // Collections
            61, 62, 63, 64,   // Media
        ],
        order: 3,
    },
    {
        slug: 'delivery_manager',
        name: 'Delivery Manager',
        permissions: [
            33,                // ORDER_GET
            69, 70, 71, 72,   // Delivers (full)
        ],
        order: 4,
    },
];

module.exports = async (db) => {
    for (const def of ROLES) {
        const [role, created] = await db.Role.findOrCreate({
            where: { slug: def.slug },
            defaults: {
                name:        def.name,
                slug:        def.slug,
                is_system:   true,
                permissions: def.permissions,
                modules:     def.permissions,
                start_page:  0,
                order:       def.order,
                status:      0,
            },
        });

        if (!created) {
            await role.update({
                name:        def.name,
                is_system:   true,
                permissions: def.permissions,
                modules:     def.permissions,
                order:       def.order,
            });
            console.log(`  Role "${def.slug}" already exists (id=${role.id}) — refreshed.`);
        } else {
            console.log(`  Role "${def.slug}" created (id=${role.id}).`);
        }
    }
};
