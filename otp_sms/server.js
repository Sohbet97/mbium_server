import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import pg from 'pg';

import { sendOtpPush, encrypt } from './service/push.service.js';

dotenv.config();

const { Client } = pg;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const pgClient = new Client({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    port: Number(process.env.PG_PORT),
});

try {
    await pgClient.connect();
    console.log('✅ PostgreSQL connected');
} catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Called by relay phone after it successfully sends the SMS
app.put('/ping', async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'id required' });
        }

        await markOtpAsSended(id);

        return res.status(200).json({ status: true, message: 'ok' });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
});

// Relay phone registers/updates its FCM token for offline fallback
app.post('/update', async (req, res) => {
    try {
        const { phone, token } = req.body;

        if (!phone || !token) {
            return res.status(400).json({ error: 'phone and token required' });
        }

        await saveFcmToken(phone, token);
        console.log(`📲 FCM token updated for relay phone ${phone}`);

        return res.status(200).json({ status: true });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
});

// ─── DB helpers ──────────────────────────────────────────────────────────────

async function saveFcmToken(phone, token) {
    await pgClient.query(
        `INSERT INTO device_tokens (phone, fcm_token)
         VALUES ($1, $2)
         ON CONFLICT (phone)
         DO UPDATE SET fcm_token = EXCLUDED.fcm_token, updated_at = CURRENT_TIMESTAMP`,
        [phone, token]
    );
}

async function markOtpAsSended(id) {
    const result = await pgClient.query(
        `UPDATE otp_codes SET is_sended = TRUE WHERE id = $1 AND is_sended = FALSE RETURNING id`,
        [id]
    );

    if (result.rowCount === 0) {
        console.log(`⚠️ OTP ${id} already processed or not found`);
        return false;
    }

    console.log(`✅ OTP ${id} marked as sent`);
    return true;
}

async function getAllTokens() {
    const result = await pgClient.query('SELECT fcm_token FROM device_tokens');
    return result.rows.map(r => r.fcm_token);
}

async function removeToken(token) {
    await pgClient.query('DELETE FROM device_tokens WHERE fcm_token = $1', [token]);
}

// ─── Socket.IO — relay phone connections ─────────────────────────────────────

const onlinePhones = new Set();

function getRandomRelayPhone() {
    const phones = Array.from(onlinePhones);
    if (phones.length === 0) return null;
    return phones[Math.floor(Math.random() * phones.length)];
}

io.on('connection', (socket) => {
    socket.on('register', async ({ phone, token }) => {
        socket.phone = phone;
        socket.join(phone);

        if (token) await saveFcmToken(phone, token);
        onlinePhones.add(phone);

        console.log(`📱 Relay phone ${phone} connected (${onlinePhones.size} online)`);
    });

    socket.on('disconnect', (reason) => {
        if (socket.phone) {
            onlinePhones.delete(socket.phone);
            console.log(`🔴 Relay phone ${socket.phone} offline | reason: ${reason}`);
        }
    });
});

// ─── PostgreSQL LISTEN — OTP delivery ────────────────────────────────────────

async function startListener() {
    await pgClient.query('LISTEN otp_channel');
    console.log('👂 Listening on otp_channel...');

    pgClient.on('notification', async (msg) => {
        let payload;
        try {
            payload = JSON.parse(msg.payload);
        } catch {
            console.error('❌ Invalid otp_channel payload:', msg.payload);
            return;
        }

        const { id, phone, code } = payload;
        console.log(`📨 OTP event received — id=${id} phone=${phone}`);

        let delivered = false;

        if (onlinePhones.size > 0) {
            // Send to a random available relay phone via Socket.IO
            const relayPhone = getRandomRelayPhone();
            const encrypted = encrypt(String(code));

            io.to(relayPhone).emit('otp', {
                iv: encrypted.iv,
                data: encrypted.data,
                tag: encrypted.tag,
                otp_id: String(id),
                phone: String(phone),
            });

            console.log(`📡 OTP dispatched via Socket.IO to relay ${relayPhone}`);
            delivered = true;
        } else {
            // Fallback: FCM push to all registered relay phones
            const allTokens = await getAllTokens();

            if (allTokens.length === 0) {
                console.log('⚠️ No relay phones online and no FCM tokens registered');
            } else {
                for (const token of allTokens) {
                    const success = await sendOtpPush(token, id, code, phone);
                    if (success) {
                        console.log('✅ OTP delivered via FCM');
                        delivered = true;
                        break;
                    } else {
                        console.log('⚠️ FCM token failed, removing');
                        await removeToken(token);
                    }
                }

                if (!delivered) {
                    console.log('❌ All FCM tokens failed — OTP could not be delivered');
                }
            }
        }

        if (delivered) {
            await markOtpAsSended(id);
        }
    });
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown() {
    console.log('🛑 Shutting down OTP service...');
    await pgClient.end();
    server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ─── Start ────────────────────────────────────────────────────────────────────

startListener();

const PORT = Number(process.env.PORT) || 5000;
server.listen(PORT, () => {
    console.log(`🚀 OTP relay service running on port ${PORT}`);
});
