const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Seeding buses...');

    const busesToCreate = [
        { bus_number: 'SL-AC-101', bus_type: 'Regular Aircon', capacity: 49 },
        { bus_number: 'SL-FC-201', bus_type: 'First Class', capacity: 45 },
        { bus_number: 'SL-ORD-301', bus_type: 'Ordinary', capacity: 49 }
    ];

    const { data: buses, error: busError } = await supabase
        .from('buses')
        .upsert(busesToCreate, { onConflict: 'bus_number' })
        .select();

    if (busError) {
        console.error('Error seeding buses:', JSON.stringify(busError, null, 2));
        return;
    }

    console.log('Buses seeded:', buses.map(b => `${b.bus_number} (${b.bus_type})`).join(', '));

    const busMap = {};
    buses.forEach(b => {
        busMap[b.bus_type] = b.id;
    });

    // Schedule definitions: Daet → Cubao for all of March 2026
    const schedules = [
        {
            bus_type: 'Regular Aircon',
            times: ['07:30', '09:00', '14:00', '18:30', '19:45'],
            price: 650.00
        },
        {
            bus_type: 'First Class',
            times: ['19:00', '20:30', '21:00'],
            price: 950.00
        },
        {
            bus_type: 'Ordinary',
            times: ['12:00', '16:45', '19:00', '20:00'],
            price: 450.00
        }
    ];

    const tripsToCreate = [];

    // Loop through every day in March 2026
    for (let day = 1; day <= 31; day++) {
        const dateStr = `2026-03-${String(day).padStart(2, '0')}`;

        for (const schedule of schedules) {
            const busId = busMap[schedule.bus_type];
            if (!busId) {
                console.warn(`No bus found for type: ${schedule.bus_type}`);
                continue;
            }

            for (const time of schedule.times) {
                const [hours, minutes] = time.split(':').map(Number);
                // Use UTC to avoid timezone shifts
                const departure = new Date(`${dateStr}T${time}:00+08:00`);

                tripsToCreate.push({
                    bus_id: busId,
                    origin: 'DAET',
                    destination: 'CUBAO',
                    departure_time: departure.toISOString(),
                    price: schedule.price
                });
            }
        }
    }

    console.log(`Inserting ${tripsToCreate.length} trips for March 2026...`);

    // Insert in batches of 50 to avoid payload limits
    const batchSize = 50;
    let inserted = 0;
    for (let i = 0; i < tripsToCreate.length; i += batchSize) {
        const batch = tripsToCreate.slice(i, i + batchSize);
        const { error: tripError } = await supabase.from('trips').insert(batch);
        if (tripError) {
            console.error(`Error inserting batch at index ${i}:`, JSON.stringify(tripError, null, 2));
            return;
        }
        inserted += batch.length;
        console.log(`  Inserted ${inserted}/${tripsToCreate.length} trips...`);
    }

    console.log(`\n✅ Done! Successfully seeded ${tripsToCreate.length} Daet → Cubao trips for all of March 2026.`);
}

seed();
