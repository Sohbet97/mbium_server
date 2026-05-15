/**
 * Seeder: Superadmin role + admin user
 *
 * Idempotent — safe to run multiple times.
 * Credentials printed to console on first creation only.
 *
 * Default admin login:
 *   Phone:    61000000
 *   Password: Admin@1234
 */

const bcrypt = require('bcryptjs');

// All permission IDs defined in utils/permissions.js
const ALL_PERMISSIONS = [
    1, 2, 3, 4,       // Roles
    5, 6, 7, 8,       // Users
    9, 10, 11, 12,    // Positions
    13, 14, 15, 16,   // Regions
    17, 18, 19, 20,   // Villages
    21, 22, 23, 24,   // Countries
    25, 26, 27, 28,   // Categories
    29, 30, 31, 32,   // Products
    33, 34, 35, 36,   // Orders
    37, 38, 39, 40,   // Reviews
    41, 42, 43, 44,   // Discounts
];

const ADMIN_PHONE    = '61000000';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME     = 'Admin';

module.exports = async (db) => {
    // ── 1. Superadmin role ────────────────────────────────────────────────────
    console.log('  Creating superadmin role…');

    const [role, roleCreated] = await db.Role.findOrCreate({
        where: { name: 'Superadmin' },
        defaults: {
            name: 'Superadmin',
            permissions: ALL_PERMISSIONS,
            modules: ALL_PERMISSIONS,
            start_page: 0,
            order: 0,
            status: 0,
        },
    });

    if (!roleCreated) {
        // Keep permissions up-to-date in case new ones were added
        await role.update({ permissions: ALL_PERMISSIONS, modules: ALL_PERMISSIONS });
        console.log(`  Role already exists (id=${role.id}) — permissions refreshed.`);
    } else {
        console.log(`  Role created (id=${role.id}).`);
    }

    // ── 2. Admin user ─────────────────────────────────────────────────────────
    console.log('  Creating admin user…');

    const existing = await db.User.findOne({ where: { phone_number: ADMIN_PHONE } });

    if (existing) {
        // Ensure the user is assigned to the superadmin role and is active
        await existing.update({ role_id: role.id, status: 1 });
        console.log(`  User already exists (id=${existing.id}) — role & status confirmed.`);
        return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const user = await db.User.create({
        name: ADMIN_NAME,
        phone_number: ADMIN_PHONE,
        password: passwordHash,
        status: 1,   // STATUS_ACTIVATED
        role_id: role.id,
    });

    console.log(`  Admin user created (id=${user.id}).`);
    console.log('');
    console.log('  ┌──────────────────────────────┐');
    console.log(`  │  Phone:    ${ADMIN_PHONE}         │`);
    console.log(`  │  Password: ${ADMIN_PASSWORD}     │`);
    console.log('  └──────────────────────────────┘');
};
