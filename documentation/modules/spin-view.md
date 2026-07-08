# 360° Product Spin View — Mobile Integration Guide

This document describes the data model and REST API for the 360° product spin
view feature, for mobile (Flutter) developers integrating the seller capture
flow and the buyer spin viewer.

**Backend location:** `backend/__modules__/catalog/services/spin-view.js`,
`backend/routes/seller/products.js`

Design background: [`documentation/development/360-product-view.md`](../development/360-product-view.md)

---

## 1. Concept

A product can have an ordered sequence of "spin frames" — photos taken (or
AI-generated) at evenly-spaced rotation angles around the product. The mobile
app renders these as a drag-to-rotate 360° viewer.

Frames are stored as regular `Media` records (type `image`), linked to the
product via `ProductMedia` rows with:

- `role = "spin"`
- `sort_order` = the frame's index, **0-based and contiguous** (`0..N-1`)

The rotation angle of frame `i` is implicitly:

```
angle_deg = i * (360 / N)
```

where `N` is the total number of spin frames for the product.

> ⚠️ **Important:** `sort_order` must always be a contiguous `0..N-1`
> sequence. If the seller deletes a frame, the remaining frames must be
> re-numbered to close the gap (otherwise the angle math above breaks).
> The web seller UI already handles this — if the mobile app implements
> its own delete/reorder, it must do the same (see §5).

This `role = "spin"` is distinct from the existing `role = "360"`, which is
used for **equirectangular panorama photos** (rendered via Pannellum) — a
different, unrelated feature. Spin frames are plain product photos.

---

## 2. Data Schemas

### Media

```jsonc
{
  "id": "a14552c8-3146-48b0-a005-9b38d8874e95",  // UUID
  "filename": "spin-0.png",
  "original_name": "spin-0.png",
  "mime_type": "image/png",
  "size": 1884012,
  "type": "image",                // "image" | "video" | "3d" | "360"
  "url": "https://.../media/images/a14552c8-....png",   // absolute URL, ready to display
  "thumbnail_url": "https://.../media/thumbs/thumb_....webp", // may be null
  "alt_text": null,
  "width": 1024,
  "height": 1024
}
```

### ProductMedia (one spin frame)

```jsonc
{
  "id": 142,
  "product_id": 1,
  "media_id": "a14552c8-3146-48b0-a005-9b38d8874e95",
  "role": "spin",        // "primary" | "gallery" | "video" | "3d" | "360" | "spin"
  "sort_order": 0,        // frame index, 0..N-1
  "media": { /* Media object, see above */ }
}
```

### Spin sequence (derived)

To render the viewer, fetch all `ProductMedia` for the product, filter
`role === "spin"`, and sort by `sort_order` ascending. The resulting array
**is** the manifest — there is no separate manifest file or endpoint.

```jsonc
// Example: 12-frame sequence
[
  { "sort_order": 0,  "media": { "url": ".../spin-0.png" } },  // 0°
  { "sort_order": 1,  "media": { "url": ".../spin-1.png" } },  // 30°
  { "sort_order": 2,  "media": { "url": ".../spin-2.png" } },  // 60°
  // ... up to sort_order: 11 (330°)
]
```

---

## 3. Endpoints

All endpoints require seller authentication:

```
Authorization: Bearer <seller_jwt>
X-Shop-Id: <shop_uuid>          (required when seller owns multiple shops)
```

`X-Shop-Id` selects which of the seller's shops to operate under. The server
verifies the shop belongs to the authenticated user — an unowned or inactive ID
is silently ignored and falls back to the first active shop. If omitted and the
seller owns only one shop, it resolves automatically.

The product must belong to the resolved shop (`shop_id` ownership check is
enforced server-side; otherwise `404 Haryt tapylmady`).

### 3.1 Get product media (includes spin frames)

```
GET /seller/media/product/:productId
```

**Response `200`:**
```jsonc
{
  "data": [
    { "id": 10, "role": "primary", "sort_order": 0, "media": { ... } },
    { "id": 11, "role": "gallery", "sort_order": 0, "media": { ... } },
    { "id": 142, "role": "spin", "sort_order": 0, "media": { ... } },
    { "id": 143, "role": "spin", "sort_order": 1, "media": { ... } }
    // ...
  ]
}
```

Mobile app: filter `role === "spin"`, sort by `sort_order`, render viewer.
If the array has zero `"spin"` items, the product has no 360° view —
fall back to the regular image gallery.

---

### 3.2 Generate spin view from existing product photos

```
POST /seller/products/:id/spin/generate
Content-Type: application/json
```

**Body:**
```jsonc
{
  "media_ids": ["uuid1", "uuid2"],   // 1-4 existing Media IDs (front/side/back/top)
  "frame_count": 12                  // 12 | 24 | 36 (default: 12)
}
```

**Response `200`:**
```jsonc
{
  "data": [ /* full ProductMedia[] for the product, including new role="spin" frames */ ]
}
```

**Errors (`400`):**
- `"Iň az 1 surat saýlaň"` — fewer than 1 reference image
- `"Iň köp 4 surat saýlap bolýar"` — more than 4 reference images
- `"Kadr sany 12/24/36 bolmaly"` — invalid `frame_count`
- `"Salgylanma suratlaryň käbiri tapylmady"` — one or more `media_ids` not found
- `"Gemini {N}° kadry döretmedi"` — AI generation failed for a specific angle

> ⚠️ **Replaces existing spin frames.** If the product already has a spin
> sequence, it is fully deleted (detached + removed) before the new one is
> generated.

---

### 3.3 Upload photos and generate spin view (recommended for mobile)

This is the primary endpoint for the **mobile capture flow**: the seller
takes 1-4 photos of the product with their phone camera, and the app uploads
them directly — no need to pre-upload to the gallery first.

```
POST /seller/products/:id/spin/generate-from-upload
Content-Type: multipart/form-data
```

**Form fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `files` | file[] | yes | 1-4 image files (jpeg/png/webp/etc.) |
| `frame_count` | string/number | no | `12` \| `24` \| `36`, default `12` |

**Side effect:** the uploaded photos are also attached to the product's main
gallery (`role: "gallery"`), so they appear in the regular photo gallery too.

**Response `200`:** same shape as §3.2 — full `ProductMedia[]` including the
new `role: "spin"` frames.

**Errors (`400`):**
- `"Iň az 1 surat ýükläň"` — no files in the request
- Same generation errors as §3.2

**Example (cURL):**
```bash
curl -X POST "$API_BASE/seller/products/1/spin/generate-from-upload" \
  -H "Authorization: Bearer $SELLER_JWT" \
  -F "files=@front.jpg" \
  -F "files=@side.jpg" \
  -F "frame_count=12"
```

---

## 4. Timing & UX Guidance

- Generation is **synchronous** — the HTTP request stays open for the full
  duration. For `frame_count: 12` expect roughly **30-90 seconds**;
  `24`/`36` will take proportionally longer.
- The mobile app **must** use a long request timeout (recommend ≥ 3 minutes)
  and show a progress/loading state ("Döredilýär… 1-2 min").
- There is currently no job queue / polling endpoint — a future iteration may
  move this to an async job with a status-polling endpoint. If that lands,
  this doc will be updated with the new contract.

---

## 5. Reordering / Deleting Frames (if implementing management UI on mobile)

These reuse the generic product-media endpoints (not spin-specific):

```
PATCH /seller/media/product/:productId/:mediaId
Body: { "sort_order": <int> }

DELETE /seller/media/product/:productId/:mediaId
```

**Rules:**
- After any reorder or delete, **re-write `sort_order` for all remaining
  `role: "spin"` items to `0..N-1`** in a batch of PATCH calls, in the
  desired final order. This keeps the angle formula (`i * 360/N`) correct.
- `DELETE` on a `media_id` that's already detached returns `200` with
  `{ "model": null }` (idempotent, not an error).

---

## 6. Viewer Rendering Notes

- Frames are plain images (`type: "image"`, pure white background per the
  AI prompt) — no special player/library is required, just an `<img>`/
  `Image` widget swapped on drag.
- Reference web implementation: `frontend/src/components/media/SpinViewer.jsx`
  — horizontal drag/swipe of `~8px` per frame step, with auto-spin and a
  scrubber. Port this interaction model to Flutter (e.g. `GestureDetector`
  with `onHorizontalDragUpdate` cycling the displayed frame index).
- Always use `media.url` (absolute URL) directly — no path joining needed.
- Use `media.thumbnail_url` (480x480 webp) for any low-res preview/loading
  placeholder before the full-res frame loads.

---

## 7. Open Questions / Future Work

- Async job queue + status polling for generation (avoids long-held HTTP
  connections on mobile networks).
- Bulk/catalog-wide generation.
- Buyer-side analytics (spin engagement vs. conversion).
