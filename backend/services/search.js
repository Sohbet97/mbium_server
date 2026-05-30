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

async function searchProducts(tsQuery, { limit = 20, shopId, categoryId } = {}) {
    const shopFilter    = shopId     ? `AND p.shop_id = ${parseInt(shopId, 10)}`     : ''
    const categoryFilter = categoryId ? `AND p.category_id = ${parseInt(categoryId, 10)}` : ''

    return db.sequelize.query(
        `SELECT
            p.id, p.name, p.name_ru, p.name_eng, p.slug, p.price, p.currency,
            p.rating, p.review_count, p.is_active, p.shop_id, p.category_id,
            p."createdAt",
            ts_rank(
                to_tsvector('simple',
                    COALESCE(p.name, '')     || ' ' || COALESCE(p.name_ru, '')  || ' ' ||
                    COALESCE(p.name_eng, '') || ' ' || COALESCE(p.sku, '')      || ' ' ||
                    COALESCE(p.description, '')
                ),
                to_tsquery('simple', :q)
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
         ORDER BY rank DESC, p."createdAt" DESC
         LIMIT :limit`,
        { replacements: { q: tsQuery, limit }, type: QueryTypes.SELECT }
    )
}

async function searchCategories(tsQuery, { limit = 10 } = {}) {
    return db.sequelize.query(
        `SELECT
            c.id, c.name, c.name_ru, c.name_eng, c.slug, c.icon, c.parent_id,
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

module.exports = { search, searchProducts, searchCategories, searchShops, buildTsQuery }
