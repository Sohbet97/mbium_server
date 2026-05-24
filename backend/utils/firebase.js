const admin = require('firebase-admin')
const path  = require('path')

let _bucket = null

function _initApp() {
    if (admin.apps.length) return
    const serviceAccount = require(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH
            ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
            : path.resolve(__dirname, '../config/firebase-adminsdk.json')
    )
    admin.initializeApp({
        credential:    admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? serviceAccount.project_id + '.appspot.com',
    })
}

function getBucket() {
    if (_bucket) return _bucket
    _initApp()
    _bucket = admin.storage().bucket()
    return _bucket
}

function getMessaging() {
    _initApp()
    return admin.messaging()
}

/**
 * Upload a Buffer to Firebase Storage and return its public URL.
 * @param {Buffer}  buffer
 * @param {string}  destPath   e.g. "media/images/uuid.jpg"
 * @param {string}  contentType  MIME type
 * @returns {Promise<string>}  Public HTTPS URL
 */
async function uploadBuffer(buffer, destPath, contentType) {
    const bucket = getBucket()
    const file   = bucket.file(destPath)

    await file.save(buffer, {
        metadata:  { contentType },
        resumable: false,
    })

    await file.makePublic()

    return `https://storage.googleapis.com/${bucket.name}/${destPath}`
}

/**
 * Delete a file from Firebase Storage by its storage path.
 * Silently ignores 404 (already deleted).
 */
async function deleteFile(destPath) {
    if (!destPath) return
    try {
        await getBucket().file(destPath).delete()
    } catch (e) {
        if (e.code !== 404) console.error('[firebase-storage] delete error:', e.message)
    }
}

/**
 * Extract the Firebase Storage path from a public URL.
 * "https://storage.googleapis.com/BUCKET/media/images/x.jpg" → "media/images/x.jpg"
 */
function urlToPath(publicUrl) {
    const bucket = getBucket()
    return publicUrl.replace(`https://storage.googleapis.com/${bucket.name}/`, '')
}

/**
 * Send a push notification to multiple FCM tokens via multicast.
 * Automatically chunks into batches of 500 (FCM limit).
 * @param {string[]} tokens
 * @param {{ title: string, body: string, imageUrl?: string }} notification
 * @param {object} [data]  Extra key-value pairs (all values must be strings)
 * @returns {Promise<{ successCount: number, failureCount: number }>}
 */
async function sendMulticastNotification(tokens, notification, data = {}) {
    if (!tokens.length) return { successCount: 0, failureCount: 0 }

    const CHUNK = 500
    let successCount = 0
    let failureCount = 0

    const messaging = getMessaging()
    const stringData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
    )

    for (let i = 0; i < tokens.length; i += CHUNK) {
        const chunk = tokens.slice(i, i + CHUNK)
        const res = await messaging.sendEachForMulticast({
            tokens: chunk,
            notification: {
                title: notification.title,
                body:  notification.body,
                ...(notification.imageUrl ? { imageUrl: notification.imageUrl } : {}),
            },
            data: stringData,
        })
        successCount += res.successCount
        failureCount += res.failureCount
    }

    return { successCount, failureCount }
}

module.exports = { uploadBuffer, deleteFile, urlToPath, sendMulticastNotification }
