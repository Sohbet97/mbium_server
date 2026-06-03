import crypto from 'crypto';
import admin from '../firebase/init.js';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = crypto
    .createHash('sha256')
    .update(process.env.OTP_SECRET)
    .digest();

export async function sendOtpPush(token, id, code, phone) {
    if (!token) {
        console.log('❌ No FCM token, skip push');
        return false;
    }

    const encrypted = encrypt(String(code));

    try {
        const res = await admin.messaging().send({
            token,
            data: {
                iv: encrypted.iv,
                data: encrypted.data,
                tag: encrypted.tag,
                otp_id: String(id),
                phone: String(phone),
            },
            android: {
                priority: 'high',
                ttl: 60 * 1000,
                collapseKey: `otp_${phone}`,
            },
        });

        console.log('✅ FCM sent:', res);
        return true;
    } catch (error) {
        console.log('❌ FCM failed:', error.code, error.message);
        return false;
    }
}

export function encrypt(text) {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);

    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return {
        iv: iv.toString('base64'),
        data: encrypted.toString('base64'),
        tag: tag.toString('base64'),
    };
}
