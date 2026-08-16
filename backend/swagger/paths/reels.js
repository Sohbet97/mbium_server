const sortParam = {
    in: 'query',
    name: 'sort',
    required: false,
    schema: { type: 'string', enum: ['newest', 'oldest', 'popular'], default: 'newest' },
    description: '`newest` — latest first (default), `oldest` — earliest first, `popular` — most viewed first',
}

const reelRef        = { $ref: '#/components/schemas/Reel' }
const reelListSchema = { type: 'object', properties: { data: { type: 'array', items: reelRef }, count: { type: 'integer' } } }
const reelOneSchema  = { type: 'object', properties: { model: reelRef } }
const json           = (schema) => ({ content: { 'application/json': { schema } } })

const giftTypeRef        = { $ref: '#/components/schemas/GiftType' }
const giftTypeListSchema = { type: 'object', properties: { data: { type: 'array', items: giftTypeRef } } }
const reelGiftRef        = { $ref: '#/components/schemas/ReelGift' }
const reelGiftListSchema = { type: 'object', properties: { data: { type: 'array', items: reelGiftRef }, count: { type: 'integer' } } }
const reelGiftOneSchema  = { type: 'object', properties: { model: reelGiftRef } }

module.exports = {

    // ── Buyer (public) ────────────────────────────────────────────────────────

    '/buyer/reels': {
        get: {
            tags: ['Buyer — Reels'],
            summary: 'Paginated reels feed (public)',
            description:
                'Returns active reels ordered by `sort` param. ' +
                'Opening a single reel via `GET /buyer/reels/:id` automatically increments its `view_count`.',
            parameters: [
                { in: 'query', name: 'limit',   schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',    schema: { type: 'integer', default: 1  } },
                { in: 'query', name: 'shop_id', schema: { type: 'integer' }, description: 'Filter to one shop\'s reels' },
                sortParam,
            ],
            responses: {
                200: { description: 'Reels feed', ...json(reelListSchema) },
            },
        },
    },

    '/buyer/reels/{id}': {
        get: {
            tags: ['Buyer — Reels'],
            summary: 'Get single reel (increments view_count)',
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Reel', ...json(reelOneSchema) },
                404: { description: 'Not found' },
            },
        },
    },

    '/buyer/reels/{id}/like': {
        post: {
            tags: ['Buyer — Reels'],
            summary: 'Like a reel',
            description: 'Idempotent — liking an already-liked reel returns 200 instead of erroring.',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Already liked' },
                201: { description: 'Liked' },
                404: { description: 'Reel not found or not visible to buyers' },
            },
        },
        delete: {
            tags: ['Buyer — Reels'],
            summary: 'Unlike a reel',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Unliked' },
                404: { description: 'Not liked' },
            },
        },
    },

    '/buyer/reels/gift-types': {
        get: {
            tags: ['Buyer — Reels'],
            summary: 'Catalog of purchasable gifts',
            description: 'Active gift types only, ordered by `sort_order`. Send one via `POST /buyer/reels/{id}/gifts`.',
            responses: {
                200: { description: 'Gift types', ...json(giftTypeListSchema) },
            },
        },
    },

    '/buyer/reels/{id}/gifts': {
        get: {
            tags: ['Buyer — Reels'],
            summary: 'Gifts received on a reel',
            parameters: [
                { in: 'path',  name: 'id',    required: true, schema: { type: 'integer' } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',  schema: { type: 'integer', default: 1  } },
            ],
            responses: {
                200: { description: 'Gifts', ...json(reelGiftListSchema) },
            },
        },
        post: {
            tags: ['Buyer — Reels'],
            summary: 'Send a gift to a reel',
            description:
                'Debits `gift_type.price_coin` from the buyer\'s coin wallet, credits the gift\'s creator with 70% of ' +
                '`price_tmt` (30% platform commission) — the reel\'s shop receives nothing from this. ' +
                'Only reels that are `is_active` and approved (`moderation_status = 1`) can receive gifts.',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            requestBody: { required: true, ...json({ $ref: '#/components/schemas/ReelGiftSendRequest' }) },
            responses: {
                201: { description: 'Sent', ...json(reelGiftOneSchema) },
                400: { description: 'Missing gift_type_id, or insufficient coin balance' },
                404: { description: 'Reel not found/not visible, or gift type not found' },
            },
        },
    },

    // ── Seller ────────────────────────────────────────────────────────────────

    '/seller/reels': {
        get: {
            tags: ['Seller — Reels'],
            summary: "List own shop's reels",
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'limit',     schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',      schema: { type: 'integer', default: 1  } },
                { in: 'query', name: 'is_active', schema: { type: 'boolean' } },
                sortParam,
            ],
            responses: {
                200: { description: 'Reels list', ...json(reelListSchema) },
            },
        },
        post: {
            tags: ['Seller — Reels'],
            summary: 'Create a reel',
            description:
                'Upload the video first via `POST /seller/media/upload` and pass the returned `model.id` as `video_id`. ' +
                'Optionally upload a cover image the same way and pass its id as `thumbnail_id`. ' +
                'New reels always start with `moderation_status = 0` (PENDING) and only appear to buyers once an admin approves them.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                ...json({ $ref: '#/components/schemas/ReelCreateRequest' }),
            },
            responses: {
                201: { description: 'Created', ...json(reelOneSchema) },
                400: { description: 'Validation error' },
                404: { description: 'Media or product not found' },
            },
        },
    },

    '/seller/reels/{id}': {
        get: {
            tags: ['Seller — Reels'],
            summary: 'Get own reel by ID',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Reel', ...json(reelOneSchema) },
                404: { description: 'Not found' },
            },
        },
        put: {
            tags: ['Seller — Reels'],
            summary: 'Update reel',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            requestBody: { ...json({ $ref: '#/components/schemas/ReelUpdateRequest' }) },
            responses: {
                200: { description: 'Updated' },
                404: { description: 'Not found' },
            },
        },
        delete: {
            tags: ['Seller — Reels'],
            summary: 'Delete own reel (soft delete)',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Deleted' },
                404: { description: 'Not found' },
            },
        },
    },

    '/seller/reels/{id}/gifts': {
        get: {
            tags: ['Seller — Reels'],
            summary: 'Gifts received on own reel',
            description: 'Read-only engagement view — the shop does not receive any revenue share from gifts (that goes to the gift\'s creator).',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'path',  name: 'id',    required: true, schema: { type: 'integer' } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',  schema: { type: 'integer', default: 1  } },
            ],
            responses: {
                200: { description: 'Gifts', ...json(reelGiftListSchema) },
                404: { description: 'Not found' },
            },
        },
    },

    // ── Admin ─────────────────────────────────────────────────────────────────

    '/admin/reels': {
        get: {
            tags: ['Reels'],
            summary: 'List all reels (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'limit',     schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',      schema: { type: 'integer', default: 1  } },
                { in: 'query', name: 'shop_id',   schema: { type: 'integer' } },
                { in: 'query', name: 'is_active', schema: { type: 'boolean' } },
                { in: 'query', name: 'moderation_status', schema: { type: 'integer', enum: [0, 1, 2] } },
                sortParam,
            ],
            responses: {
                200: { description: 'Reels', ...json(reelListSchema) },
            },
        },
        post: {
            tags: ['Reels'],
            summary: 'Create a reel for any shop (admin)',
            description:
                'Admin-created reels are auto-approved (`moderation_status = 1`) unless explicitly overridden. ' +
                'Upload the video first via `POST /admin/media/upload` and pass the returned `model.id` as `video_id`.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                ...json({ $ref: '#/components/schemas/AdminReelCreateRequest' }),
            },
            responses: {
                201: { description: 'Created', ...json(reelOneSchema) },
                400: { description: 'Validation error' },
                404: { description: 'Shop, media or product not found' },
            },
        },
    },

    '/admin/reels/{id}': {
        get: {
            tags: ['Reels'],
            summary: 'Get reel by ID (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Reel', ...json(reelOneSchema) },
                404: { description: 'Not found' },
            },
        },
        put: {
            tags: ['Reels'],
            summary: 'Update reel (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            requestBody: { ...json({ $ref: '#/components/schemas/ReelUpdateRequest' }) },
            responses: {
                200: { description: 'Updated' },
                404: { description: 'Not found' },
            },
        },
        delete: {
            tags: ['Reels'],
            summary: 'Delete reel (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'path',  name: 'id',    required: true, schema: { type: 'integer' } },
                { in: 'query', name: 'force', schema: { type: 'boolean' }, description: 'true = hard delete' },
            ],
            responses: {
                200: { description: 'Deleted' },
                404: { description: 'Not found' },
            },
        },
    },

    '/admin/reels/{id}/approve': {
        patch: {
            tags: ['Reels'],
            summary: 'Approve a reel (admin)',
            description: 'Sets `moderation_status = 1` and clears any rejection note, making the reel visible to buyers (if also `is_active`).',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Approved', ...json(reelOneSchema) },
                404: { description: 'Not found' },
            },
        },
    },

    '/admin/reels/{id}/reject': {
        patch: {
            tags: ['Reels'],
            summary: 'Reject a reel (admin)',
            description: 'Sets `moderation_status = 2` with an optional note explaining the rejection, shown to the seller.',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            requestBody: { ...json({ $ref: '#/components/schemas/ReelRejectRequest' }) },
            responses: {
                200: { description: 'Rejected', ...json(reelOneSchema) },
                404: { description: 'Not found' },
            },
        },
    },
}
