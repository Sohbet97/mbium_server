const { QueryTypes } = require('sequelize')
const db = require('../models')

// Build a prefix-match tsquery from raw user input.
// "iph one" → "iph:* & one:*"
// Returns null for blank input.
function buildTsQuery(raw) {
    const words = String(raw || '')
        .trim()
        .toLowerCase()
        .replace(/[^\w\sÀ-ɏЀ-ӿ]/g, '') // keep latin, cyrillic, diacritics
        .split(/\s+/)
        .filter(Boolean)
    if (!words.length) return null
    return words.map((w) => `${w}:*`).join(' & ')
}

// Same as buildTsQuery but any word may match: "dress, red" → "dress:* | red:*"
function buildTsQueryAny(words = []) {
    const parts = words
        .flatMap((w) => String(w || '').toLowerCase().replace(/[^\w\sÀ-ɏЀ-ӿ]/g, '').split(/\s+/))
        .filter(Boolean)
    if (!parts.length) return null
    return [...new Set(parts)].map((w) => `${w}:*`).join(' | ')
}

// tsQuery decides which products match; rankQuery (default: the same) decides their order
// ── Photo search helpers ─────────────────────────────────────────────────────
// Keyword matching by SUBSTRING on product names, so "phone" finds "Iphone 17 pro" (a tsquery prefix
// match cannot). Keywords come from an AI, so they are reduced to letters/digits/space/hyphen
// before being inlined into SQL.
const safeKeyword = (w) => String(w || '').toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').trim()

function cleanKeywords(words = [], minLen = 3) {
    return [...new Set(words.map(safeKeyword).filter((w) => w.length >= minLen))]
}

// col = SQL expression for the text to search (names + sku concatenated)
function keywordSql(primary, extra, col) {
    const like = (w) => `${col} ILIKE '%${w}%'`
    const prim = cleanKeywords(primary)
    const ext  = cleanKeywords(extra).filter((w) => !prim.includes(w))
    if (!prim.length) return null
    return {
        where: `(${prim.map(like).join(' OR ')})`,
        // primary matches weigh 3, extra 1 — the closer to the photo, the higher
        score: [...prim.map((w) => `(CASE WHEN ${like(w)} THEN 3 ELSE 0 END)`), ...ext.map((w) => `(CASE WHEN ${like(w)} THEN 1 ELSE 0 END)`)].join(' + '),
    }
}

const NAME_COL = (a) => `(COALESCE(${a}.name,'') || ' ' || COALESCE(${a}.name_ru,'') || ' ' || COALESCE(${a}.name_eng,'') || ' ' || COALESCE(${a}.sku,''))`

async function searchProductsByKeywords(primary, extra, { limit = 20, offset = 0 } = {}) {
    const kw = keywordSql(primary, extra, NAME_COL('p'))
    if (!kw) return []
    return db.sequelize.query(
        `SELECT
            p.id, p.name, p.name_ru, p.name_eng, p.handle AS slug, p.price, p.currency,
            p.rating, p.review_count, p.is_active, p.shop_id, p.category_id,
            p."createdAt", p.turbo_active AS is_turbo, p.turbo_boosted_at,
            (${kw.score}) AS rank
         FROM products p
         WHERE p."deletedAt" IS NULL AND p.is_active = true AND p.is_published = true
           AND ${kw.where}
         ORDER BY rank DESC, p.turbo_active DESC, p.turbo_boosted_at DESC NULLS LAST, p."createdAt" DESC
         LIMIT :limit OFFSET :offset`,
        { replacements: { limit, offset }, type: QueryTypes.SELECT }
    )
}

async function searchProducts(tsQuery, { limit = 20, offset = 0, shopId, categoryId, rankQuery } = {}) {
    const shopFilter    = shopId     ? `AND p.shop_id = ${parseInt(shopId, 10)}`     : ''
    const categoryFilter = categoryId ? `AND p.category_id = ${parseInt(categoryId, 10)}` : ''

    return db.sequelize.query(
        `SELECT
            p.id, p.name, p.name_ru, p.name_eng, p.handle AS slug, p.price, p.currency,
            p.rating, p.review_count, p.is_active, p.shop_id, p.category_id,
            p."createdAt", p.turbo_active AS is_turbo, p.turbo_boosted_at,
            ts_rank(
                to_tsvector('simple',
                    COALESCE(p.name, '')     || ' ' || COALESCE(p.name_ru, '')  || ' ' ||
                    COALESCE(p.name_eng, '') || ' ' || COALESCE(p.sku, '')      || ' ' ||
                    COALESCE(p.description, '')
                ),
                to_tsquery('simple', :rq)
            ) AS rank
         FROM products p
         WHERE p."deletedAt" IS NULL
           AND p.is_active    = true
           AND p.is_published = true
           ${shopFilter}
           ${categoryFilter}
           AND to_tsvector('simple',
                COALESCE(p.name, '')     || ' ' || COALESCE(p.name_ru, '')  || ' ' ||
                COALESCE(p.name_eng, '') || ' ' || COALESCE(p.sku, '')      || ' ' ||
                COALESCE(p.description, '')
               ) @@ to_tsquery('simple', :q)
         ORDER BY p.turbo_active DESC, p.turbo_boosted_at DESC NULLS LAST, rank DESC, p."createdAt" DESC
         LIMIT :limit OFFSET :offset`,
        { replacements: { q: tsQuery, rq: rankQuery || tsQuery, limit, offset }, type: QueryTypes.SELECT }
    )
}

async function searchCategories(tsQuery, { limit = 10 } = {}) {
    return db.sequelize.query(
        `SELECT
            c.id, c.name, c.name_ru, c.name_eng, c.slug, c.icon, c.image, c.thumbnail, c.parent_id,
            ts_rank(
                to_tsvector('simple',
                    COALESCE(c.name, '') || ' ' || COALESCE(c.name_ru, '') || ' ' || COALESCE(c.name_eng, '')
                ),
                to_tsquery('simple', :q)
            ) AS rank
         FROM categories c
         WHERE c."deletedAt" IS NULL
           AND c.status = 1
           AND to_tsvector('simple',
                COALESCE(c.name, '') || ' ' || COALESCE(c.name_ru, '') || ' ' || COALESCE(c.name_eng, '')
               ) @@ to_tsquery('simple', :q)
         ORDER BY rank DESC, c.name ASC
         LIMIT :limit`,
        { replacements: { q: tsQuery, limit }, type: QueryTypes.SELECT }
    )
}

async function searchShops(tsQuery, { limit = 10 } = {}) {
    return db.sequelize.query(
        `SELECT
            s.id, s.name, s.name_ru, s.name_eng, s.logo, s.rating, s.slug,
            s.description, s.is_active, s.is_verified,
            ts_rank(
                to_tsvector('simple',
                    COALESCE(s.name, '')    || ' ' || COALESCE(s.name_ru, '')  || ' ' ||
                    COALESCE(s.name_eng, '') || ' ' || COALESCE(s.description, '')
                ),
                to_tsquery('simple', :q)
            ) AS rank
         FROM shops s
         WHERE s."deletedAt" IS NULL
           AND s.is_active = true
           AND to_tsvector('simple',
                COALESCE(s.name, '')    || ' ' || COALESCE(s.name_ru, '')  || ' ' ||
                COALESCE(s.name_eng, '') || ' ' || COALESCE(s.description, '')
               ) @@ to_tsquery('simple', :q)
         ORDER BY rank DESC, s.rating DESC NULLS LAST
         LIMIT :limit`,
        { replacements: { q: tsQuery, limit }, type: QueryTypes.SELECT }
    )
}

// Unified search — runs all three in parallel and returns a structured result.
async function search(rawQuery, { productLimit = 20, categoryLimit = 8, shopLimit = 8 } = {}) {
    const q = buildTsQuery(rawQuery)
    if (!q) return { products: [], categories: [], shops: [], query: rawQuery }

    const [products, categories, shops] = await Promise.all([
        searchProducts(q, { limit: productLimit }),
        searchCategories(q, { limit: categoryLimit }),
        searchShops(q, { limit: shopLimit }),
    ])

    return { products, categories, shops, query: rawQuery }
}

module.exports = { searchProductsByKeywords, keywordSql, NAME_COL, search, searchProducts, searchCategories, searchShops, buildTsQuery, buildTsQueryAny }
