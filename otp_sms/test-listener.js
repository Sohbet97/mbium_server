/**
 * Test relay phone listener.
 * Run: node test-listener.js
 *
 * Simulates a relay phone connecting to the OTP service,
 * receiving an encrypted OTP event, and decrypting it.
 */

import { io } from 'socket.io-client';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const OTP_SERVICE_URL = process.env.4000 || 'http://216.250.11.232:4001';
const OTP_SECRET      = process.env.OTP_SECRET;
const TEST_PHONE      = process.env.TEST_RELAY_PHONE || '61000000'; // this relay phone's number
const TEST_FCM_TOKEN  = 'test-fcm-token';

if (!OTP_SECRET) {
    console.error('❌ OTP_SECRET is not set in .env');
    process.exit(1);
}

const SECRET_KEY = crypto.createHash('sha256').update(OTP_SECRET).digest();

function decrypt({ iv, data, tag }) {
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        SECRET_KEY,
        Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(data, 'base64')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}

const socket = io(OTP_SERVICE_URL, {
    transports: ['websocket'],
    reconnection: true,
});

socket.on('connect', () => {
    console.log(`✅ Connected to OTP service (id: ${socket.id})`);

    socket.emit('register', { phone: TEST_PHONE, token: TEST_FCM_TOKEN });
    console.log(`📱 Registered as relay phone: ${TEST_PHONE}`);
    console.log('👂 Waiting for OTP events...\n');
});

socket.on('otp', (payload) => {
    console.log('📨 OTP event received:');
    console.log('   Raw payload :', payload);

    try {
        const code = decrypt(payload);
        console.log('   ✅ Decrypted code :', code);
        console.log('   Target phone     :', payload.phone);
        console.log('   OTP ID           :', payload.otp_id);
        console.log('');
        console.log('   → Relay phone would now send SMS to', payload.phone, 'with code', code);
    } catch (err) {
        console.error('   ❌ Decryption failed:', err.message);
    }
});

socket.on('disconnect', (reason) => {
    console.log('🔴 Disconnected:', reason);
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection error:', err.message);
});
