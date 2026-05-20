/**
 * Seeder: Turkmenistan Locations
 * Hierarchy: Country → Regions (velayatlar) → Cities + Districts (etraplary)
 * Idempotent — uses findOrCreate at every level.
 */

// ── Country ───────────────────────────────────────────────────────────────────

const COUNTRY = { name: 'Türkmenistan', code: 'TM', ssu_code: 'TM', order: 1, status: 0 };

// ── Regions (velayatlar) ──────────────────────────────────────────────────────
// type: 0 = velayat, 1 = special city status

const REGIONS = [
    { name: 'Aşgabat',          short_name: 'ASH', type: 1, order: 1, status: 0 },
    { name: 'Ahal welaýaty',    short_name: 'AH',  type: 0, order: 2, status: 0 },
    { name: 'Balkan welaýaty',  short_name: 'BL',  type: 0, order: 3, status: 0 },
    { name: 'Daşoguz welaýaty', short_name: 'DZ',  type: 0, order: 4, status: 0 },
    { name: 'Lebap welaýaty',   short_name: 'LB',  type: 0, order: 5, status: 0 },
    { name: 'Mary welaýaty',    short_name: 'MY',  type: 0, order: 6, status: 0 },
];

// ── Cities (şäherler) — keyed by region name ──────────────────────────────────

const CITIES_BY_REGION = {
    'Aşgabat': [
        { name: 'Aşgabat',     order: 1 },
    ],
    'Ahal welaýaty': [
        { name: 'Änew',        order: 1 },
        { name: 'Tejen',       order: 2 },
        { name: 'Baharly',     order: 3 },
        { name: 'Gökdepe',     order: 4 },
        { name: 'Sarahs',      order: 5 },
        { name: 'Serhetabat',  order: 6 },
    ],
    'Balkan welaýaty': [
        { name: 'Balkanabat',  order: 1 },
        { name: 'Türkmenbaşy', order: 2 },
        { name: 'Bereket',     order: 3 },
        { name: 'Serdar',      order: 4 },
        { name: 'Gazanjyk',    order: 5 },
        { name: 'Gumdag',      order: 6 },
        { name: 'Hazar',       order: 7 },
    ],
    'Daşoguz welaýaty': [
        { name: 'Daşoguz',     order: 1 },
        { name: 'Köneürgenç',  order: 2 },
        { name: 'Boldumsaz',   order: 3 },
    ],
    'Lebap welaýaty': [
        { name: 'Türkmenabat', order: 1 },
        { name: 'Farap',       order: 2 },
        { name: 'Halaç',       order: 3 },
        { name: 'Atamyrat',    order: 4 },
        { name: 'Gazojak',     order: 5 },
    ],
    'Mary welaýaty': [
        { name: 'Mary',        order: 1 },
        { name: 'Baýramaly',   order: 2 },
        { name: 'Ýolöten',     order: 3 },
        { name: 'Murgap',      order: 4 },
        { name: 'Serhetabat',  order: 5 },
    ],
};

// ── Districts (etraplary) — keyed by region name ─────────────────────────────

const DISTRICTS_BY_REGION = {
    'Aşgabat': [
        { name: 'Berkararlyk etraby',  order: 1 },
        { name: 'Büzmeýin etraby',     order: 2 },
        { name: 'Bagtyýarlyk etraby',  order: 3 },
        { name: 'Köpetdag etraby',     order: 4 },
    ],
    'Ahal welaýaty': [
        { name: 'Ak bugdaý etraby',    order: 1 },
        { name: 'Babadaýhan etraby',   order: 2 },
        { name: 'Bäherden etraby',     order: 3 },
        { name: 'Derweze etraby',      order: 4 },
        { name: 'Gökdepe etraby',      order: 5 },
        { name: 'Kaka etraby',         order: 6 },
        { name: 'Ruhabat etraby',      order: 7 },
        { name: 'Sarahs etraby',       order: 8 },
        { name: 'Serhetabat etraby',   order: 9 },
        { name: 'Tejen etraby',        order: 10 },
    ],
    'Balkan welaýaty': [
        { name: 'Balkanabat etraby',   order: 1 },
        { name: 'Bereket etraby',      order: 2 },
        { name: 'Etrek etraby',        order: 3 },
        { name: 'Gumdag etraby',       order: 4 },
        { name: 'Hazar etraby',        order: 5 },
        { name: 'Serdar etraby',       order: 6 },
        { name: 'Türkmenbaşy etraby',  order: 7 },
    ],
    'Daşoguz welaýaty': [
        { name: 'Akdepe etraby',                   order: 1 },
        { name: 'Boldumsaz etraby',                order: 2 },
        { name: 'Görogly etraby',                  order: 3 },
        { name: 'Gubadag etraby',                  order: 4 },
        { name: 'Köneürgenç etraby',               order: 5 },
        { name: 'Ruhubelent etraby',               order: 6 },
        { name: 'Saparmyrat Türkmenbaşy etraby',   order: 7 },
        { name: 'Şabat etraby',                    order: 8 },
    ],
    'Lebap welaýaty': [
        { name: 'Çärjew etraby',        order: 1 },
        { name: 'Dänew etraby',         order: 2 },
        { name: 'Döwletli etraby',      order: 3 },
        { name: 'Farap etraby',         order: 4 },
        { name: 'Garabekewül etraby',   order: 5 },
        { name: 'Gazojak etraby',       order: 6 },
        { name: 'Halaç etraby',         order: 7 },
        { name: 'Hojambaz etraby',      order: 8 },
        { name: 'Köýtendag etraby',     order: 9 },
        { name: 'Saýat etraby',         order: 10 },
        { name: 'Türkmenabat etraby',   order: 11 },
    ],
    'Mary welaýaty': [
        { name: 'Baýramaly etraby',     order: 1 },
        { name: 'Garagum etraby',       order: 2 },
        { name: 'Mary etraby',          order: 3 },
        { name: 'Murgap etraby',        order: 4 },
        { name: 'Oguzhan etraby',       order: 5 },
        { name: 'Sakarçäge etraby',     order: 6 },
        { name: 'Serhetabat etraby',    order: 7 },
        { name: 'Tagtabazar etraby',    order: 8 },
        { name: 'Türkmengala etraby',   order: 9 },
        { name: 'Ýolöten etraby',       order: 10 },
    ],
};

// ── Villages — keyed by district name ────────────────────────────────────────
// Representative sample; extend as needed.

const VILLAGES_BY_DISTRICT = {
    // Aşgabat
    'Berkararlyk etraby':  ['Çoganly', 'Gyýanly', 'Hojahasan', 'Magtymguly', 'Şagadam'],
    'Büzmeýin etraby':     ['Abadan', 'Büzmeýin', 'Gäwers', 'Kemine', 'Owadan'],
    'Bagtyýarlyk etraby':  ['Bagtyýarlyk', 'Hitrowka', 'Parahat 1', 'Parahat 7'],
    'Köpetdag etraby':     ['Bekrewe', 'Çandybil', 'Köpetdag', 'Nurmuhammet Andalyp'],

    // Ahal
    'Ak bugdaý etraby':    ['Änew', 'Duşak', 'Gäwers', 'Köşi', 'Saragt'],
    'Bäherden etraby':     ['Bäherden', 'Baharly', 'Gökje', 'Yzgant'],
    'Gökdepe etraby':      ['Gökdepe', 'Ýaşlyk', 'Bökürdek', 'Gümmüdowuk'],
    'Kaka etraby':         ['Kaka', 'Artyk', 'Hanhowuz', 'Meana', 'Mürzebeg'],
    'Tejen etraby':        ['Tejen', 'Gowşut', 'Hanýap', 'Ýerbent'],
    'Sarahs etraby':       ['Sarahs', 'Garahan', 'Çemenabat'],

    // Balkan
    'Balkanabat etraby':   ['Balkanabat', 'Awaza', 'Gara Bogaz'],
    'Türkmenbaşy etraby':  ['Türkmenbaşy', 'Gyýanlyk', 'Hazar', 'Jebel'],
    'Bereket etraby':      ['Bereket', 'Gazanjyk', 'Maşat'],
    'Serdar etraby':       ['Serdar', 'Derweze', 'Gyzylarbat'],
    'Etrek etraby':        ['Etrek', 'Gyzyletrek', 'Hojagala'],

    // Daşoguz
    'Akdepe etraby':                 ['Akdepe', 'Göreler', 'Ýylanly'],
    'Boldumsaz etraby':              ['Boldumsaz', 'Gurbansoltan eje', 'Ruhyýet'],
    'Görogly etraby':                ['Görogly', 'Köneşäher', 'Tagta'],
    'Köneürgenç etraby':             ['Köneürgenç', 'Akyýap', 'Güneşli'],
    'Ruhubelent etraby':             ['Ruhubelent', 'Ýylgynlyk', 'Garaköl'],
    'Saparmyrat Türkmenbaşy etraby': ['Daşoguz şäheri', 'Bagtyýarlyk', 'Täze zaman'],

    // Lebap
    'Çärjew etraby':      ['Farap', 'Saýat', 'Halaç', 'Akja'],
    'Farap etraby':       ['Farap', 'Sakar', 'Isgender'],
    'Halaç etraby':       ['Halaç', 'Jeýhun', 'Kerki'],
    'Gazojak etraby':     ['Gazojak', 'Atamyrat', 'Dänew'],
    'Köýtendag etraby':   ['Köýtendag', 'Hojagala', 'Zahmet'],
    'Türkmenabat etraby': ['Türkmenabat', 'Seýdi', 'Naýip'],

    // Mary
    'Baýramaly etraby':   ['Baýramaly', 'Düýeboýun', 'Ýalkym'],
    'Mary etraby':        ['Mary', 'Murgap', 'Oguzhan', 'Türkmengala'],
    'Murgap etraby':      ['Murgap', 'Gurbansoltan', 'Guwlymaýak'],
    'Ýolöten etraby':     ['Ýolöten', 'Dänewler', 'Elçiler'],
    'Serhetabat etraby':  ['Serhetabat', 'Tagtabazar', 'Guşgy'],
    'Tagtabazar etraby':  ['Tagtabazar', 'Imam Baba', 'Galaýmor'],
};

// ── Seeder ────────────────────────────────────────────────────────────────────

module.exports = async (db) => {
    console.log('  Seeding locations (country → regions → cities + districts → villages)...');

    // ── 1. Country ─────────────────────────────────────────────────────────────
    const [country] = await db.Country.findOrCreate({
        where: { code: COUNTRY.code },
        defaults: COUNTRY,
    });
    console.log(`  Country: ${country.name}`);

    // ── 2. Regions ─────────────────────────────────────────────────────────────
    const regionMap = {}; // name → Region instance
    for (const r of REGIONS) {
        const [region] = await db.Region.findOrCreate({ where: { name: r.name }, defaults: r });
        regionMap[r.name] = region;
    }
    console.log(`  Regions: ${Object.keys(regionMap).length} upserted`);

    // ── 3. Cities ──────────────────────────────────────────────────────────────
    let cityCount = 0;
    for (const [regionName, cities] of Object.entries(CITIES_BY_REGION)) {
        const region = regionMap[regionName];
        if (!region) continue;
        for (const city of cities) {
            await db.City.findOrCreate({
                where: { region_id: region.id, name: city.name },
                defaults: { ...city, region_id: region.id, status: 0 },
            });
            cityCount++;
        }
    }
    console.log(`  Cities: ${cityCount} upserted`);

    // ── 4. Districts ───────────────────────────────────────────────────────────
    const districtMap = {}; // name → District instance
    let districtCount = 0;
    for (const [regionName, districts] of Object.entries(DISTRICTS_BY_REGION)) {
        const region = regionMap[regionName];
        if (!region) continue;
        for (const d of districts) {
            const [district] = await db.District.findOrCreate({
                where: { region_id: region.id, name: d.name },
                defaults: { ...d, region_id: region.id, status: 0 },
            });
            districtMap[d.name] = district;
            districtCount++;
        }
    }
    console.log(`  Districts: ${districtCount} upserted`);

    // ── 5. Villages ────────────────────────────────────────────────────────────
    let villageCount = 0;
    for (const [districtName, villages] of Object.entries(VILLAGES_BY_DISTRICT)) {
        const district = districtMap[districtName];
        if (!district) continue;
        for (let i = 0; i < villages.length; i++) {
            await db.Village.findOrCreate({
                where: { district_id: district.id, name: villages[i] },
                defaults: { name: villages[i], district_id: district.id, order: i + 1, status: 0 },
            });
            villageCount++;
        }
    }
    console.log(`  Villages: ${villageCount} upserted`);

    console.log('  Done: locations seeded');
};
