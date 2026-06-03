import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// аналог __dirname в ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// читаем JSON вручную
const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'serviceAccount.json'), 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

console.log('🔥 Firebase initialized');

export default admin;
