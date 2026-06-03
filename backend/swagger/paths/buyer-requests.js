const ref  = (s) => ({ $ref: `#/components/schemas/${s}` })
const json = (schema) => ({ content: { 'application/json': { schema } } })

const listSchema = { type: 'object', properties: { data: { type: 'array', items: ref('BuyerRequest') }, count: { type: 'integer' } } }
const oneSchema  = { type: 'object', properties: { model: ref('BuyerRequest') } }

module.exports = {

    // ── Buyer ─────────────────────────────────────────────────────────────────

    '/buyer/requests': {
        get: {
            tags: ['Buyer — Requests'],
            summary: 'List own buyer requests',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'limit',  schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',   schema: { type: 'integer', default: 1  } },
                { in: 'query', name: 'status', schema: { type: 'integer', enum: [0, 1] }, description: '0=active, 1=closed' },
            ],
            responses: {
                200: { description: 'Buyer requests', ...json(listSchema) },
            },
        },
        post: {
            tags: ['Buyer — Requests'],
            summary: 'Create buyer request — notifies matching shops',
            description:
                'Buyer posts what they need (text and/or images). ' +
                'The server finds all active shops in the given `city_id` and sends them ' +
                'a push notification (FCM) + in-app notification. ' +
                'At least one of `text` or `images` is required.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                ...json(ref('BuyerRequestCreate')),
            },
            responses: {
                201: { description: 'Created', ...json(oneSchema) },
                400: { description: 'Validation error (text and images both missing)' },
            },
        },
    },

    '/buyer/requests/{id}': {
        get: {
            tags: ['Buyer — Requests'],
            summary: 'Get own buyer request by ID',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Buyer request', ...json(oneSchema) },
                404: { description: 'Not found' },
            },
        },
    },

    '/buyer/requests/{id}/close': {
        patch: {
            tags: ['Buyer — Requests'],
            summary: 'Close own request (mark as fulfilled)',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Closed' },
                404: { description: 'Not found' },
            },
        },
    },

    '/buyer/requests/{id}/delete': {
        delete: {
            tags: ['Buyer — Requests'],
            summary: 'Delete own request',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Deleted' },
                404: { description: 'Not found' },
            },
        },
    },

    // ── Notifications (buyer) ────────────────────────────────────────────────

    '/buyer/notifications': {
        get: {
            tags: ['Buyer — Notifications'],
            summary: 'List own notifications',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',  schema: { type: 'integer', default: 1  } },
            ],
            responses: {
                200: {
                    description: 'Notifications',
                    ...json({ type: 'object', properties: {
                        data:  { type: 'array', items: ref('Notification') },
                        count: { type: 'integer' },
                    }}),
                },
            },
        },
        delete: {
            tags: ['Buyer — Notifications'],
            summary: 'Delete all read notifications',
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: 'Deleted' } },
        },
    },

    '/buyer/notifications/{id}/read': {
        patch: {
            tags: ['Buyer — Notifications'],
            summary: 'Mark one notification as read',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Marked as read' },
                404: { description: 'Not found' },
            },
        },
    },

    '/buyer/notifications/read-all': {
        patch: {
            tags: ['Buyer — Notifications'],
            summary: 'Mark all notifications as read',
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: 'All marked as read' } },
        },
    },

    '/buyer/notifications/{id}': {
        delete: {
            tags: ['Buyer — Notifications'],
            summary: 'Delete one notification',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Deleted' },
                404: { description: 'Not found' },
            },
        },
    },

    // ── Admin ─────────────────────────────────────────────────────────────────

    '/admin/buyer-requests': {
        get: {
            tags: ['Buyer Requests'],
            summary: 'List all buyer requests (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'limit',   schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',    schema: { type: 'integer', default: 1  } },
                { in: 'query', name: 'user_id', schema: { type: 'string', format: 'uuid' } },
                { in: 'query', name: 'city_id', schema: { type: 'integer' } },
                { in: 'query', name: 'status',  schema: { type: 'integer', enum: [0, 1] } },
            ],
            responses: {
                200: { description: 'Buyer requests', ...json(listSchema) },
            },
        },
    },

    '/admin/buyer-requests/{id}': {
        get: {
            tags: ['Buyer Requests'],
            summary: 'Get buyer request by ID (admin)',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Buyer request', ...json(oneSchema) },
                404: { description: 'Not found' },
            },
        },
    },
}
