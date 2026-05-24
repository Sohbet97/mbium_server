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

// Media files go to Firebase Storage — use memory so the buffer is available
exports.mediaUpload = multer({
    storage: multer.memoryStorage(),
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

// ── KYC / shop-docs upload config ────────────────────────────────────────────
const KYC_DIR = path.join(CONSTANTS.PUBLIC_FOLDER, "shop-docs");
if (!fs.existsSync(KYC_DIR)) fs.mkdirSync(KYC_DIR, { recursive: true });

const KYC_ALLOWED = [
    'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
    'application/pdf',
    'video/mp4', 'video/quicktime', 'video/webm',
];

const kycStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, KYC_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.bin';
        cb(null, `${req.user?.id ?? 'unknown'}-${file.fieldname}-${uuidv4()}${ext}`);
    },
});

exports.kycUpload = multer({
    storage: kycStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB (covers video)
    fileFilter: (_req, file, cb) => {
        if (KYC_ALLOWED.includes(file.mimetype)) cb(null, true);
        else cb(new Error(`Goldanylmaýan faýl görnüşi: ${file.mimetype}`));
    },
});
// ─────────────────────────────────────────────────────────────────────────────

// ── Shop logo upload config ───────────────────────────────────────────────────
const SHOP_LOGOS_DIR = path.join(CONSTANTS.PUBLIC_FOLDER, "shop-logos");
if (!fs.existsSync(SHOP_LOGOS_DIR)) fs.mkdirSync(SHOP_LOGOS_DIR, { recursive: true });

const shopLogoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, SHOP_LOGOS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `shop-${req.shop?.id ?? 'unknown'}-${uuidv4()}${ext}`);
    },
});

exports.shopLogoUpload = multer({
    storage: shopLogoStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Diňe surat faýllary rugsat edilýär'));
    },
});
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
