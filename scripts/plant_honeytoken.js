require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Honeytoken = require('../models/Honeytoken');

async function plantHoneytoken() {
    console.log("🚀 Starting Honeytoken Injection Pipeline...");

    if (!process.env.MONGO_URI) {
        console.error("❌ MONGO_URI missing in .env");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to Database");

        // 1. Generate a realistic-looking fake API Key with a specific fake prefix
        const rawToken = crypto.randomBytes(32).toString('hex');
        const fakeToken = `pct_fake_live_${rawToken}`;

        // 2. Save it to Database
        const description = "Planted in .env.backup via CI/CD pipeline script";
        const honeytoken = new Honeytoken({
            tokenValue: fakeToken,
            description: description
        });

        await honeytoken.save();
        console.log(`✅ Honeytoken stored in database: ${fakeToken.substring(0, 15)}...`);

        // 3. Plant it in a bait file
        const baitFilePath = path.join(__dirname, '../.env.backup');
        const baitContent = `# Database Backup Credentials
# DO NOT COMMIT THIS FILE TO VERSION CONTROL
DB_HOST=cluster0.pixelcraft.mongodb.net
DB_USER=superadmin
DB_PASS=S3cr3tP@ssw0rd!
PIXELCRAFT_API_KEY=${fakeToken}
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
`;

        fs.writeFileSync(baitFilePath, baitContent, 'utf8');
        console.log(`✅ Bait file planted successfully at: ${baitFilePath}`);
        console.log("🎉 CI/CD Pipeline completed. Trap is active.");

    } catch (err) {
        console.error("❌ Pipeline failed:", err.message);
    } finally {
        mongoose.disconnect();
    }
}

plantHoneytoken();
