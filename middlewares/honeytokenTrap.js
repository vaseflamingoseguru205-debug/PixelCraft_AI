const axios = require('axios');
const Honeytoken = require('../models/Honeytoken');
const TrapLog = require('../models/TrapLog');
const { sendTelegramAlert } = require('../utils/telegramAlert');

// Extract potential API keys from headers or query
function extractToken(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    if (req.headers['x-api-key']) {
        return req.headers['x-api-key'];
    }
    if (req.query.api_key) {
        return req.query.api_key;
    }
    return null;
}

// Get client IP address accurately
function getClientIp(req) {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    if (ip && ip.includes(',')) {
        ip = ip.split(',')[0];
    }
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1'; // Localhost normalization
    }
    return ip;
}

async function honeytokenTrap(req, res, next) {
    const tokenValue = extractToken(req);
    if (!tokenValue) {
        return next();
    }

    try {
        const honeytoken = await Honeytoken.findOne({ tokenValue, isActive: true });
        
        if (!honeytoken) {
            // Not a honeypot token, let normal auth middleware handle it
            return next();
        }

        // --- TRAP TRIGGERED ---
        console.log(`\n🚨 [SECURITY ALERT] Honeytoken triggered by IP! Key: ${honeytoken.description}`);
        
        const ip = getClientIp(req);
        let location = 'Unknown';
        let isp = 'Unknown';

        // OSINT IP Lookup using ip-api.com
        if (ip !== '127.0.0.1') {
            try {
                const geoRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,city,isp,query`);
                if (geoRes.data && geoRes.data.status === 'success') {
                    location = `${geoRes.data.city}, ${geoRes.data.country}`;
                    isp = geoRes.data.isp;
                }
            } catch (err) {
                console.error("OSINT Lookup Failed:", err.message);
            }
        } else {
            location = 'Local Environment';
            isp = 'Localhost';
        }

        const userAgent = req.headers['user-agent'] || 'Unknown';
        const method = req.method;
        const endpoint = req.originalUrl;
        const payloadSent = { body: req.body, query: req.query };

        // Save to Database
        const trapLog = new TrapLog({
            tokenId: honeytoken._id,
            ipAddress: ip,
            location,
            isp,
            userAgent,
            method,
            endpoint,
            payloadSent
        });
        await trapLog.save();

        // Send Telegram Alert
        const alertMsg = `🚨 <b>PHANTOM TRAP TRIGGERED</b> 🚨\n\n` +
                         `<b>Key:</b> ${honeytoken.description}\n` +
                         `<b>IP Address:</b> <code>${ip}</code>\n` +
                         `<b>Location:</b> ${location}\n` +
                         `<b>ISP:</b> ${isp}\n` +
                         `<b>Method:</b> ${method} ${endpoint}\n` +
                         `<b>User-Agent:</b> <code>${userAgent}</code>\n\n` +
                         `<i>Action Taken: Blocked & Tarpitted</i>`;
        
        await sendTelegramAlert(alertMsg);

        // Send a fake response to confuse the attacker
        res.status(200).json({
            status: "success",
            data: {
                id: "usr_94a7d6",
                email: "admin@pixelcraft.ai",
                role: "superadmin",
                permissions: ["*"],
                lastLogin: new Date().toISOString(),
                secretFlag: "PCT{h0n3yp0t_c4ught_y0u}"
            }
        });

    } catch (err) {
        console.error("Honeytoken middleware error:", err);
        return next();
    }
}

module.exports = honeytokenTrap;
