const admin = require('firebase-admin')
const path  = require('path')
const fs    = require('fs')

const MEDIA_BASE = path.resolve(process.cwd(), 'storage', 'media')

function _initApp() {
    if (admin.apps.length) return
    const serviceAccount = require(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH
            ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
            : path.resolve(__dirname, '../config/firebase-adminsdk.json')
    )
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    })
}

function getMessaging() {
    _initApp()
    return admin.messaging()
}

/**
 * Write a Buffer to local disk under storage/media/ and return the public URL.
 * destPath is relative to the media root, e.g. "media/images/uuid.jpg".
 */
async function uploadBuffer(buffer, destPath, _contentType) {
    // destPath: "media/images/uuid.jpg" → write to storage/media/images/uuid.jpg
    const relativePath = destPath.replace(/^media\//, '')
    const filePath = path.join(MEDIA_BASE, relativePath)
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
    await fs.promises.writeFile(filePath, buffer)
    const base = (process.env.APP_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '')
    return `${base}/media/${relativePath}`
}

/**
 * Delete a file from local storage by its destPath (e.g. "media/images/uuid.jpg").
 * Silently ignores missing files.
 */
async function deleteFile(destPath) {
    if (!destPath) return
    const relativePath = destPath.replace(/^media\//, '')
    const filePath = path.join(MEDIA_BASE, relativePath)
    try {
        await fs.promises.unlink(filePath)
    } catch (e) {
        if (e.code !== 'ENOENT') console.error('[local-storage] delete error:', e.message)
    }
}

/**
 * Extract the storage destPath from a local media URL.
 * "http://localhost:4000/media/images/x.jpg" → "media/images/x.jpg"
 */
function urlToPath(publicUrl) {
    const match = publicUrl.match(/\/media\/(.+)$/)
    return match ? `media/${match[1]}` : publicUrl
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
