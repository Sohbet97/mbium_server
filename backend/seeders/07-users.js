/**
 * Seeder: 5 customer users for testing orders, reviews, etc.
 * Idempotent — skips if any non-admin users already exist.
 *
 * Credentials (all share the same password):
 *   Password: Test@1234
 *   Phones: 61100001 … 61100005
 */

const bcrypt = require('bcryptjs');

const PASSWORD = 'Test@1234';

const CUSTOMERS = [
    { name: 'Merdan',  surname: 'Durdyyew',   phone_number: '61100001', email: 'merdan@test.tm' },
    { name: 'Aýnur',   surname: 'Annagurbanowa', phone_number: '61100002', email: 'aynur@test.tm' },
    { name: 'Döwlet',  surname: 'Hojamow',    phone_number: '61100003', email: 'dowlet@test.tm' },
    { name: 'Leýla',   surname: 'Meredowa',   phone_number: '61100004', email: 'leyla@test.tm' },
    { name: 'Batyr',   surname: 'Orazow',     phone_number: '61100005', email: 'batyr@test.tm' },
];

module.exports = async (db) => {
    console.log('  Checking existing customers…');

    const existing = await db.User.findAll({
        where: { phone_number: CUSTOMERS.map(c => c.phone_number) },
        attributes: ['phone_number'],
    });

    if (existing.length === CUSTOMERS.length) {
        console.log(`  Skipping: all ${CUSTOMERS.length} customer users already exist`);
        return;
    }

    const existingPhones = new Set(existing.map(u => u.phone_number));
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    const rows = CUSTOMERS
        .filter(c => !existingPhones.has(c.phone_number))
        .map(c => ({
            ...c,
            password: passwordHash,
            status: 1,   // active
            role_id: null,
        }));

    await db.User.bulkCreate(rows);

    console.log(`  Done: ${rows.length} customer(s) created`);
    console.log('');
    console.log('  ┌──────────────────────────────────────┐');
    console.log('  │  Password for all: Test@1234         │');
    CUSTOMERS.forEach(c => console.log(`  │  Phone: ${c.phone_number}  →  ${c.name} ${c.surname.padEnd(15)}│`));
    console.log('  └──────────────────────────────────────┘');
};
