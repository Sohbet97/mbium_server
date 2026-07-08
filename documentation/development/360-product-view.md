## Feature: AI-Powered 360° Product Spin View Generator

### Overview

A feature that allows sellers to upload 2–4 standard product photos and automatically generate a full 360° interactive spin view using Google's Gemini image generation API (Nano Banana). The output is embedded directly on the product listing page as a draggable, interactive spin viewer.

---

### User Flow

**Seller side (upload)**
1. Seller opens the product editor and navigates to the "360° View" tab
2. Uploads 2–4 photos of the product from different angles (front, side, back, top)
3. Clicks "Generate 360° View"
4. System sends photos to Gemini API and generates 24–36 angle frames in the background
5. Seller previews the result and confirms or re-generates
6. Frames are saved to cloud storage and linked to the product listing

**Buyer side (view)**
1. Product page shows a "360° View" badge on the main product image
2. Buyer clicks or taps to activate the spin viewer
3. Drags left/right to rotate the product interactively
4. Can zoom in, auto-spin, or scrub through frames manually

---

### Technical Components

**Frontend**
- React component: photo uploader with drag-and-drop, 2–4 image slots
- 360 spin viewer component (canvas-based, touch + mouse support)
- Progress indicator during frame generation (can take 30–90 seconds)
- Frame caching in the browser after first load

**Backend**
- REST endpoint: `POST /api/products/:id/spin-view`
- Receives base64-encoded reference images
- Iteratively calls `gemini-3-pro-image` (Nano Banana Pro) with angle-specific prompts
- Generates 24 or 36 frames (every 15° or 10°)
- Uploads frames to object storage (S3 / Firebase Storage / MinIO)
- Saves frame URLs to the product record in PostgreSQL
- Returns a signed URL manifest to the frontend

**AI prompt strategy per frame**
```
"Product photo, studio lighting, pure white background,
exact same product as the reference images, [N]° rotation
from front. Maintain color, texture, and material fidelity.
No shadows on background. Commercial product photography style."
```

**Storage structure**
```
/products/{productId}/spin/{frameIndex}.webp   (0–35)
/products/{productId}/spin/manifest.json
```

---

### Key Constraints & Considerations

| Item | Detail |
|---|---|
| Generation time | 30–120 sec total; must be async with job queue |
| Cost | ~$0.04–0.12 per frame with Nano Banana Pro; ~$1.5–4 per full 36-frame set |
| Consistency | Good for solid objects (electronics, shoes, bottles); less reliable for highly transparent or reflective products |
| Storage | ~36 WebP frames at ~80KB each = ~3MB per product |
| Regeneration | Seller can delete and re-generate; old frames are cleaned up |
| Fallback | If generation fails, product page falls back to standard image gallery |

---

### Phased Rollout Suggestion

**Phase 1 — MVP**
Seller uploads photos → backend generates 12 frames (30° steps) → basic spin viewer on product page

**Phase 2 — Quality**
36 frames (10° steps), zoom support, mobile touch gestures, auto-spin on page load

**Phase 3 — Scale**
Bulk generation for existing catalog, generation queue with webhook notifications, seller analytics on spin view engagement vs. conversion rate

---

### Dependencies

- Google AI API key (Gemini / Nano Banana Pro access)
- Job queue: BullMQ + Redis (you already have Redis in your stack)
- Object storage: Firebase Storage or MinIO
- Frontend: React + existing component library