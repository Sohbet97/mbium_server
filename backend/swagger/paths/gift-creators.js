const json = (schema) => ({ content: { 'application/json': { schema } } })

const creatorRef      = { $ref: '#/components/schemas/GiftCreator' }
const creatorOneSchema  = { type: 'object', properties: { model: creatorRef } }
const creatorListSchema = { type: 'object', properties: { data: { type: 'array', items: creatorRef }, count: { type: 'integer' } } }

const txRef        = { $ref: '#/components/schemas/GiftCreatorTransaction' }
const txListSchema = { type: 'object', properties: { data: { type: 'array', items: txRef }, count: { type: 'integer' } } }

const giftTypeRef        = { $ref: '#/components/schemas/GiftType' }
const giftTypeOneSchema  = { type: 'object', properties: { model: giftTypeRef } }
const giftTypeListSchema = { type: 'object', properties: { data: { type: 'array', items: giftTypeRef } } }

const reelGiftRef        = { $ref: '#/components/schemas/ReelGift' }
const reelGiftListSchema = { type: 'object', properties: { data: { type: 'array', items: reelGiftRef }, count: { type: 'integer' } } }

module.exports = {

    // ── Gift Creators (admin) ────────────────────────────────────────────────────

    '/admin/gift-creators': {
        get: {
            tags: ['Gift Creators'],
            summary: 'List gift creators',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',  schema: { type: 'integer', default: 1  } },
            ],
            responses: { 200: { description: 'Gift creators', ...json(creatorListSchema) } },
        },
        post: {
            tags: ['Gift Creators'],
            summary: 'Create a gift creator',
            security: [{ bearerAuth: [] }],
            requestBody: { required: true, ...json({ $ref: '#/components/schemas/GiftCreatorCreateRequest' }) },
            responses: {
                201: { description: 'Created', ...json(creatorOneSchema) },
                400: { description: 'Validation error' },
            },
        },
    },

    '/admin/gift-creators/{id}': {
        get: {
            tags: ['Gift Creators'],
            summary: 'Get gift creator by ID',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Gift creator', ...json(creatorOneSchema) },
                404: { description: 'Not found' },
            },
        },
        put: {
            tags: ['Gift Creators'],
            summary: 'Update gift creator',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            requestBody: { ...json({ $ref: '#/components/schemas/GiftCreatorCreateRequest' }) },
            responses: {
                200: { description: 'Updated', ...json(creatorOneSchema) },
                404: { description: 'Not found' },
            },
        },
        delete: {
            tags: ['Gift Creators'],
            summary: 'Delete gift creator',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: { 200: { description: 'Deleted' } },
        },
    },

    '/admin/gift-creators/{id}/transactions': {
        get: {
            tags: ['Gift Creators'],
            summary: "Gift creator's revenue ledger (balance/transactions/revenue)",
            description: 'Full transaction history for a gift creator — GIFT_CREDIT (their 70% share) and COMMISSION (audit-only, the platform\'s 30%) rows.',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'path',  name: 'id',    required: true, schema: { type: 'integer' } },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',  schema: { type: 'integer', default: 1  } },
            ],
            responses: {
                200: { description: 'Transactions', ...json(txListSchema) },
                404: { description: 'Not found' },
            },
        },
    },

    // ── Gift Types (admin catalog) ───────────────────────────────────────────────

    '/admin/gift-types': {
        get: {
            tags: ['Gift Types'],
            summary: 'List gift types (admin — includes inactive)',
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: 'Gift types', ...json(giftTypeListSchema) } },
        },
        post: {
            tags: ['Gift Types'],
            summary: 'Create a gift type',
            description:
                'Upload the GIF first via `POST /admin/media/upload`, pass its `model.id` as `animation_id`. ' +
                "The referenced media row is reclassified to `type='gift'` if it isn't already.",
            security: [{ bearerAuth: [] }],
            requestBody: { required: true, ...json({ $ref: '#/components/schemas/GiftTypeCreateRequest' }) },
            responses: {
                201: { description: 'Created', ...json(giftTypeOneSchema) },
                400: { description: 'Validation error' },
                404: { description: 'Media or gift creator not found' },
            },
        },
    },

    '/admin/gift-types/{id}': {
        get: {
            tags: ['Gift Types'],
            summary: 'Get gift type by ID',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Gift type', ...json(giftTypeOneSchema) },
                404: { description: 'Not found' },
            },
        },
        put: {
            tags: ['Gift Types'],
            summary: 'Update gift type',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            requestBody: { ...json({ $ref: '#/components/schemas/GiftTypeCreateRequest' }) },
            responses: {
                200: { description: 'Updated', ...json(giftTypeOneSchema) },
                404: { description: 'Not found' },
            },
        },
        delete: {
            tags: ['Gift Types'],
            summary: 'Delete gift type',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: { 200: { description: 'Deleted' } },
        },
    },

    // ── Sent gifts (admin, read-only audit view) ─────────────────────────────────

    '/admin/reel-gifts': {
        get: {
            tags: ['Gift Types'],
            summary: 'List all gifts sent on reels (admin audit view)',
            description: 'Read-only feed of every reel_gifts row — who sent what to which reel, and which creator was credited.',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'limit',           schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',             schema: { type: 'integer', default: 1  } },
                { in: 'query', name: 'reel_id',          schema: { type: 'integer' } },
                { in: 'query', name: 'gift_creator_id',  schema: { type: 'integer' } },
            ],
            responses: { 200: { description: 'Sent gifts', ...json(reelGiftListSchema) } },
        },
    },
}
