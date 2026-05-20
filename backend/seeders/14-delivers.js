/**
 * Seeder: Delivery Drivers
 * Idempotent — skips if any delivers already exist.
 */

const DELIVERS = [
    {
        first_name: 'Serdar',
        last_name:  'Orazow',
        status:     1,
        phones:     ['+99361111111'],
        cityName:   'Aşgabat',
    },
    {
        first_name: 'Merdan',
        last_name:  'Hydyrow',
        status:     1,
        phones:     ['+99362222222', '+99365555555'],
        cityName:   'Aşgabat',
    },
    {
        first_name: 'Kakajan',
        last_name:  'Amanow',
        status:     0,
        phones:     ['+99363333333'],
        cityName:   'Aşgabat',
    },
    {
        first_name: 'Döwran',
        last_name:  'Geldiýew',
        status:     1,
        phones:     ['+99364444444'],
        cityName:   'Mary',
    },
    {
        first_name: 'Batyr',
        last_name:  'Meredow',
        status:     0,
        phones:     ['+99365000000'],
        cityName:   'Türkmenabat',
    },
];

module.exports = async (db) => {
    console.log('  Seeding delivers...');

    const existing = await db.Deliver.count();
    if (existing > 0) {
        console.log(`  Skipping: ${existing} delivers already exist`);
        return;
    }

    // Resolve city IDs by name
    const cityNames = [...new Set(DELIVERS.map(d => d.cityName))];
    const [cityRows] = await db.sequelize.query(
        `SELECT id, name FROM cities WHERE name IN (:names) LIMIT 20`,
        { replacements: { names: cityNames } }
    );
    const cityMap = Object.fromEntries(cityRows.map(c => [c.name, c.id]));

    const rows = DELIVERS.map(({ cityName, ...fields }) => ({
        ...fields,
        city_id: cityMap[cityName] ?? null,
    }));

    await db.Deliver.bulkCreate(rows);
    console.log(`  Done: ${rows.length} delivers`);
};
