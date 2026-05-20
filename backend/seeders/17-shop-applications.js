/**
 * Seeder: test shop applications
 *
 * Creates 3 buyer users, each with a shop application in a different state,
 * so the admin /shop-applications panel can be tested end-to-end.
 *
 * Idempotent — keyed on phone_number / shop name, safe to re-run.
 *
 * Test accounts (password for all: Buyer@1234)
 * ─────────────────────────────────────────────────────────────────────────────
 *  61200001  Merdan Durdyýew   → pending (standard applicant)
 *  61200002  Aýna Geldiýewa    → pending + KYC docs  (Verified PRO candidate)
 *  61200003  Serdar Annagurban → rejected (with rejection note)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const bcrypt = require('bcryptjs');

const PASSWORD = 'Buyer@1234';

const APPLICANTS = [
    // ── 1. Standard pending application ──────────────────────────────────────
    {
        user: {
            name:         'Merdan',
            surname:      'Durdyýew',
            phone_number: '61200001',
        },
        shop: {
            typeName:            'Elektronika dükany',
            name:                'Merdan Tech',
            name_ru:             'Мердан Тех',
            description:         'Elektron önümler we aksesuarlar',
            phone:               '61200001',
            email:               'merdan@example.tm',
            address:             'Aşgabat, Bitarap Türkmenistan şaýoly 5',
            verification_status: 1,    // pending review
            is_active:           false,
        },
    },

    // ── 2. Verified PRO candidate (has patent + bank IBAN) ────────────────────
    {
        user: {
            name:         'Aýna',
            surname:      'Geldiýewa',
            phone_number: '61200002',
        },
        shop: {
            typeName:            'Egin-eşik dükany',
            name:                'Aýna Moda',
            name_ru:             'Айна Мода',
            description:         'Zenanlar üçin moda geýim we aksessuarlar',
            phone:               '61200002',
            email:               'ayna@example.tm',
            address:             'Aşgabat, Magtymguly şaýoly 12',
            verification_status: 1,    // pending review
            is_active:           false,
            // KYC — placeholder paths (files don't need to exist for UI testing)
            passport_file:       '/static/shop-docs/sample-passport.jpg',
            patent_file:         '/static/shop-docs/sample-patent.pdf',
            bank_iban:           'TM35000700189700149001',
            video_url:           '/static/shop-docs/sample-intro.mp4',
        },
    },

    // ── 3. Rejected application ───────────────────────────────────────────────
    {
        user: {
            name:         'Serdar',
            surname:      'Annagurban',
            phone_number: '61200003',
        },
        shop: {
            typeName:            'Ählumumy dükany',
            name:                'Serdar Market',
            name_ru:             'Сердар Маркет',
            description:         'Dürli harytlar',
            phone:               '61200003',
            address:             'Aşgabat, Garaşsyzlyk şaýoly 77',
            verification_status: 3,    // rejected
            is_active:           false,
            verification_note:   'Passport suratyny aýdyň görnüşde iberiň. Şeýle hem dükan ady bilen işiň arasynda gabat gelme ýok.',
        },
    },
];

module.exports = async (db) => {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    // Resolve all needed shop-type IDs up front
    const typeNames = [...new Set(APPLICANTS.map(a => a.shop.typeName))];
    const [typeRows] = await db.sequelize.query(
        `SELECT id, name FROM shop_types WHERE "deletedAt" IS NULL AND name IN (:names)`,
        { replacements: { names: typeNames } }
    );
    const typeMap = Object.fromEntries(typeRows.map(t => [t.name, t.id]));

    for (const { user: userDef, shop: shopDef } of APPLICANTS) {
        // ── User ──────────────────────────────────────────────────────────────
        const [user, userCreated] = await db.User.findOrCreate({
            where: { phone_number: userDef.phone_number },
            defaults: {
                ...userDef,
                password: passwordHash,
                status:   1,   // STATUS_ACTIVE
                role_id:  null, // plain buyer
            },
        });

        if (!userCreated) {
            console.log(`  User ${userDef.phone_number} already exists (id=${user.id}) — skipping shop check`);
            continue;
        }

        console.log(`  User created: ${userDef.name} ${userDef.surname} (${userDef.phone_number}, id=${user.id})`);

        // ── Shop ──────────────────────────────────────────────────────────────
        const typeId = typeMap[shopDef.typeName];
        if (!typeId) {
            console.log(`  ⚠ Shop type "${shopDef.typeName}" not found — run shop-types seeder first`);
            continue;
        }

        const { typeName, ...shopFields } = shopDef;

        const existing = await db.Shop.findOne({ where: { owner_id: user.id } });
        if (existing) {
            console.log(`  Shop for user ${user.id} already exists — skipping`);
            continue;
        }

        const shop = await db.Shop.create({
            ...shopFields,
            owner_id: user.id,
            type_id:  typeId,
        });

        const statusLabel = {
            1: 'pending',
            2: 'approved',
            3: 'rejected',
        }[shopDef.verification_status] ?? shopDef.verification_status;

        console.log(`  Shop "${shop.name}" created (id=${shop.id}, status=${statusLabel})`);
    }

    console.log('');
    console.log('  Test accounts (password: Buyer@1234)');
    console.log('  ┌──────────────────────────────────────────────────────┐');
    console.log('  │  61200001  Merdan Durdyýew    pending (standard)     │');
    console.log('  │  61200002  Aýna Geldiýewa     pending (Verified PRO) │');
    console.log('  │  61200003  Serdar Annagurban  rejected               │');
    console.log('  └──────────────────────────────────────────────────────┘');
};
