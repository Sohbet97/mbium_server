const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { CONSTANTS } = require("../config/constants");

// ── Media upload config ───────────────────────────────────────────────────────
const MEDIA_BASE = path.resolve(process.cwd(), 'storage', 'media')
const ALLOWED_IMAGE = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/avif','image/svg+xml']
const ALLOWED_VIDEO = ['video/mp4','video/quicktime','video/webm']
const ALLOWED_3D    = ['model/gltf-binary','model/gltf+json']
const EXT_3D        = ['.glb','.gltf']

function ensureMediaDirs() {
    ['images','videos','3d','360','thumbs'].forEach((s) =>
        fs.mkdirSync(path.join(MEDIA_BASE, s), { recursive: true })
    )
}

function resolveType(mimetype, originalname) {
    if (ALLOWED_VIDEO.includes(mimetype)) return 'video'
    const ext = path.extname(originalname).toLowerCase()
    if (ALLOWED_3D.includes(mimetype) || EXT_3D.includes(ext)) return '3d'
    if (ALLOWED_IMAGE.includes(mimetype)) return 'image'
    return null
}

const mediaStorage = multer.diskStorage({
    destination(req, file, cb) {
        ensureMediaDirs()
        const type = resolveType(file.mimetype, file.originalname)
        const is360 = req.query.media_type === '360' && type === 'image'
        const sub   = is360 ? '360' : type === 'video' ? 'videos' : type === '3d' ? '3d' : 'images'
        cb(null, path.join(MEDIA_BASE, sub))
    },
    filename(_req, file, cb) {
        cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`)
    },
})

exports.mediaUpload = multer({
    storage: mediaStorage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (!resolveType(file.mimetype, file.originalname))
            return cb(new Error(`Unsupported type: ${file.mimetype}`), false)
        cb(null, true)
    },
})
exports.resolveType = resolveType
exports.MEDIA_BASE  = MEDIA_BASE
exports.ensureMediaDirs = ensureMediaDirs
// ─────────────────────────────────────────────────────────────────────────────

const AVATARS_DIR = path.join(CONSTANTS.PUBLIC_FOLDER, "avatars");
if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${req.user.id}${ext}`);
  },
});

exports.avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});
