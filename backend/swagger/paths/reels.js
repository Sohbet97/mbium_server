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
                'Optionally upload a cover image the same way and pass its id as `thumbnail_id`.',
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
                sortParam,
            ],
            responses: {
                200: { description: 'Reels', ...json(reelListSchema) },
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
}
