// Colour is not a column — it lives as a conventional key inside
// product_variants.attributes (JSONB). See ProductVariant.model.js.
//
//   { color: 'Gyzyl', color_en: 'Red', color_hex: '#ef4444', storage: '128GB' }
//
// Seeded rows use `hex` rather than `color_hex`, so both are accepted on read;
// the editor always writes `color_hex`.

export const COLOR_KEYS     = ['color', 'colour', 'renk', 'reňk', 'цвет']
export const COLOR_HEX_KEYS = ['color_hex', 'hex', 'renk_hex']

// The key the editor writes when the user picks a swatch
export const CANONICAL_HEX_KEY = 'color_hex'

function norm(key) {
  return String(key ?? '').trim().toLowerCase()
}

export function isColorKey(key) {
  return COLOR_KEYS.includes(norm(key))
}

export function isColorHexKey(key) {
  return COLOR_HEX_KEYS.includes(norm(key))
}

/**
 * Accepts `#rgb`, `#rrggbb` or the same without the leading `#`.
 * Returns a normalised `#rrggbb`, or null when the value isn't a hex colour
 * (e.g. a plain name like "red" — we don't guess those).
 */
export function normalizeHex(value) {
  const v = String(value ?? '').trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(v)) return `#${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}`.toLowerCase()
  if (/^[0-9a-f]{6}$/i.test(v)) return `#${v}`.toLowerCase()
  return null
}

/**
 * Pull `{ label, hex }` out of one product or variant.
 *
 * Prefers the `color_hex` column (and its joined `color` row, when the endpoint
 * included one); falls back to the legacy free-text attributes for rows created
 * before the colours table existed. Returns null when there's no colour at all.
 */
export function colorOf(row) {
  const columnHex = normalizeHex(row?.color_hex)
  if (columnHex) {
    return { label: row?.color?.name ?? columnHex, hex: columnHex }
  }

  const attrs = row?.attributes
  if (!attrs || typeof attrs !== 'object') return null

  let label = null
  let hex = null
  for (const [k, v] of Object.entries(attrs)) {
    if (label == null && isColorKey(k) && String(v ?? '').trim()) label = String(v).trim()
    if (hex == null && isColorHexKey(k)) hex = normalizeHex(v)
  }
  // A bare hex with no label still reads as a colour
  if (label == null && hex == null) return null
  return { label: label ?? hex, hex }
}

/**
 * Distinct colours across a list of products/variants, in first-seen order.
 * Deduped case-insensitively by label. Returns [] when nothing has a colour.
 */
export function extractColors(rows) {
  if (!Array.isArray(rows)) return []
  const seen = new Map()
  for (const row of rows) {
    const c = colorOf(row)
    if (!c) continue
    const key = c.label.toLowerCase()
    // Keep the first occurrence, but let a later one fill in a missing hex
    if (!seen.has(key)) seen.set(key, c)
    else if (!seen.get(key).hex && c.hex) seen.set(key, c)
  }
  return [...seen.values()]
}
