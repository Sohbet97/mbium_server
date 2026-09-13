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
                'Buyer posts what they need (text and/or attachments). ' +
                'The server finds all active shops in the given `city_id` and sends them ' +
                'a push notification (FCM) + in-app notification. ' +
                'At least one of `text` or `attachments` is required.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                ...json(ref('BuyerRequestCreate')),
            },
            responses: {
                201: { description: 'Created', ...json(oneSchema) },
                400: { description: 'Validation error (text and attachments both missing)' },
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

    '/buyer/requests/{id}': {
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

    '/buyer/requests/attachments/upload': {
        post: {
            tags: ['Buyer — Requests'],
            summary: 'Upload one file (image/video/excel/word/pdf) to attach to a request or offer counter',
            description: 'Returns a URL + inferred metadata to pass in the `attachments` array of POST /buyer/requests or an offer counter.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } } },
            },
            responses: {
                201: { description: 'Uploaded', ...json(ref('BuyerRequestAttachmentInput')) },
                400: { description: 'No file, or unsupported file type' },
            },
        },
    },

    // ── ÖTS (buyer) ───────────────────────────────────────────────────────────

    '/buyer/requests/{id}/offers': {
        get: {
            tags: ['Buyer — ÖTS'],
            summary: 'Get the offer negotiation thread for own request',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: { description: 'Offer thread', ...json({ type: 'object', properties: { data: { type: 'array', items: ref('BuyerRequestOffer') } } }) },
                404: { description: 'Not found' },
            },
        },
    },

    '/buyer/requests/{id}/offers/{offerId}/counter': {
        post: {
            tags: ['Buyer — ÖTS'],
            summary: 'Counter a pending seller offer',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                { in: 'path', name: 'offerId', required: true, schema: { type: 'integer' } },
            ],
            requestBody: { required: true, ...json(ref('BuyerRequestOfferCounter')) },
            responses: { 201: { description: 'New counter-offer created', ...json({ type: 'object', properties: { model: ref('BuyerRequestOffer') } }) } },
        },
    },

    '/buyer/requests/{id}/offers/{offerId}/accept': {
        patch: {
            tags: ['Buyer — ÖTS'],
            summary: 'Accept a pending seller offer',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                { in: 'path', name: 'offerId', required: true, schema: { type: 'integer' } },
            ],
            responses: { 200: { description: 'Offer accepted', ...json({ type: 'object', properties: { model: ref('BuyerRequestOffer') } }) } },
        },
    },

    '/buyer/requests/{id}/offers/{offerId}/reject': {
        patch: {
            tags: ['Buyer — ÖTS'],
            summary: 'Reject a pending seller offer',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                { in: 'path', name: 'offerId', required: true, schema: { type: 'integer' } },
            ],
            responses: { 200: { description: 'Offer rejected', ...json({ type: 'object', properties: { model: ref('BuyerRequestOffer') } }) } },
        },
    },

    '/seller/buyer-requests/attachments/upload': {
        post: {
            tags: ['Seller — ÖTS'],
            summary: 'Upload one file (image/video/excel/word/pdf) to attach to an offer',
            description: 'Returns a URL + inferred metadata to pass in the `attachments` array of an offer create/counter.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } } },
            },
            responses: {
                201: { description: 'Uploaded', ...json(ref('BuyerRequestAttachmentInput')) },
                400: { description: 'No file, or unsupported file type' },
            },
        },
    },

    // ── ÖTS (seller) ──────────────────────────────────────────────────────────

    '/seller/buyer-requests': {
        get: {
            tags: ['Seller — ÖTS'],
            summary: 'List buyer requests relevant to own shop (direct or city-broadcast)',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
                { in: 'query', name: 'page',  schema: { type: 'integer', default: 1  } },
            ],
            responses: { 200: { description: 'Buyer requests', ...json(listSchema) } },
        },
    },

    '/seller/buyer-requests/{id}': {
        get: {
            tags: ['Seller — ÖTS'],
            summary: "Get request detail + own shop's offer thread",
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: {
                    description: 'Request + own offer thread',
                    ...json({ type: 'object', properties: { model: ref('BuyerRequest'), offers: { type: 'array', items: ref('BuyerRequestOffer') } } }),
                },
                404: { description: 'Not found' },
            },
        },
    },

    '/seller/buyer-requests/{id}/offers': {
        post: {
            tags: ['Seller — ÖTS'],
            summary: 'Submit an initial priced offer on a buyer request',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            requestBody: { required: true, ...json(ref('BuyerRequestOfferCreate')) },
            responses: { 201: { description: 'Offer created', ...json({ type: 'object', properties: { model: ref('BuyerRequestOffer') } }) } },
        },
    },

    '/seller/buyer-requests/{id}/offers/{offerId}/counter': {
        post: {
            tags: ['Seller — ÖTS'],
            summary: 'Counter a pending buyer offer',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                { in: 'path', name: 'offerId', required: true, schema: { type: 'integer' } },
            ],
            requestBody: { required: true, ...json(ref('BuyerRequestOfferCounter')) },
            responses: { 201: { description: 'New counter-offer created', ...json({ type: 'object', properties: { model: ref('BuyerRequestOffer') } }) } },
        },
    },

    '/seller/buyer-requests/{id}/offers/{offerId}/accept': {
        patch: {
            tags: ['Seller — ÖTS'],
            summary: 'Accept a pending buyer offer',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                { in: 'path', name: 'offerId', required: true, schema: { type: 'integer' } },
            ],
            responses: { 200: { description: 'Offer accepted', ...json({ type: 'object', properties: { model: ref('BuyerRequestOffer') } }) } },
        },
    },

    '/seller/buyer-requests/{id}/offers/{offerId}/reject': {
        patch: {
            tags: ['Seller — ÖTS'],
            summary: 'Reject a pending buyer offer',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                { in: 'path', name: 'offerId', required: true, schema: { type: 'integer' } },
            ],
            responses: { 200: { description: 'Offer rejected', ...json({ type: 'object', properties: { model: ref('BuyerRequestOffer') } }) } },
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
                { in: 'query', name: 'shop_id', schema: { type: 'integer' } },
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
            summary: 'Get buyer request by ID (admin), including its ÖTS offer thread',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            responses: {
                200: {
                    description: 'Buyer request + offer thread',
                    ...json({ type: 'object', properties: { model: ref('BuyerRequest'), offers: { type: 'array', items: ref('BuyerRequestOffer') } } }),
                },
                404: { description: 'Not found' },
            },
        },
    },
}
