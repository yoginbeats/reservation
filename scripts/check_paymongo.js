require('dotenv').config({ path: '.env.local' });
const https = require('https');

const secretKey = process.env.PAYMONGO_SECRET_KEY || "";
const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

function fetchPayMongo(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.paymongo.com',
            port: 443,
            path: endpoint,
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function checkPayMongo() {
    console.log("=== Checking PayMongo Payments ===");
    const payments = await fetchPayMongo('/v1/payments?limit=25');
    if (payments && payments.data) {
        console.log(`Found ${payments.data.length} PayMongo payments:`);
        payments.data.forEach((p, idx) => {
            const attr = p.attributes;
            const created = new Date(attr.created_at * 1000).toISOString();
            console.log(`\n--- Payment #${idx + 1} ---`);
            console.log(`ID: ${p.id}`);
            console.log(`Amount: ₱${(attr.amount / 100).toFixed(2)}`);
            console.log(`Status: ${attr.status}`);
            console.log(`Description: ${attr.description}`);
            console.log(`Created: ${created}`);
            console.log(`Billing:`, JSON.stringify(attr.billing));
            console.log(`Metadata:`, JSON.stringify(attr.metadata));
        });
    } else {
        console.log("Payments response:", JSON.stringify(payments));
    }

    console.log("\n=== Checking PayMongo Checkout Sessions ===");
    const checkouts = await fetchPayMongo('/v1/checkout_sessions?limit=25');
    if (checkouts && checkouts.data) {
        console.log(`Found ${checkouts.data.length} PayMongo Checkout Sessions:`);
        checkouts.data.forEach((c, idx) => {
            const attr = c.attributes;
            const created = new Date(attr.created_at * 1000).toISOString();
            console.log(`\n--- Checkout #${idx + 1} ---`);
            console.log(`ID: ${c.id}`);
            console.log(`Status: ${attr.status}`);
            console.log(`Description: ${attr.description}`);
            console.log(`Created: ${created}`);
            console.log(`Billing:`, JSON.stringify(attr.billing));
            console.log(`Metadata:`, JSON.stringify(attr.metadata));
            console.log(`Payments:`, JSON.stringify(attr.payments));
            console.log(`Line items:`, JSON.stringify(attr.line_items));
        });
    } else {
        console.log("Checkout sessions response:", JSON.stringify(checkouts));
    }
}

checkPayMongo().catch(console.error);
