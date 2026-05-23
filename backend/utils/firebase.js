const admin = require('firebase-admin')
const path  = require('path')

let _bucket = null

function getBucket() {
    if (_bucket) return _bucket

    if (!admin.apps.length) {
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

    _bucket = admin.storage().bucket()
    return _bucket
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

module.exports = { uploadBuffer, deleteFile, urlToPath }
