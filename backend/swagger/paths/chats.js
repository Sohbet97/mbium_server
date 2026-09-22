const ref  = (s) => ({ $ref: `#/components/schemas/${s}` })
const json = (schema) => ({ content: { 'application/json': { schema } } })

module.exports = {

    '/buyer/chats': {
        get: {
            tags: ['Buyer — Chats'],
            summary: 'List own chat dialogs (support + shop + product), newest first',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'query', name: 'type',  schema: { type: 'string', enum: ['support', 'shop', 'product'] }, description: 'Filter to one dialog type; omit for all' },
                { in: 'query', name: 'cursor', schema: { type: 'string' }, description: 'From a previous response\'s next_cursor' },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: { description: 'Dialogs', ...json(ref('ChatDialogList')) },
            },
        },
        post: {
            tags: ['Buyer — Chats'],
            summary: 'Open (or find existing) a chat dialog with support, a shop, or about a product',
            description: 'Idempotent — a second call for the same buyer+shop(+product) returns the existing room instead of creating a duplicate.',
            security: [{ bearerAuth: [] }],
            requestBody: { required: true, ...json(ref('ChatDialogOpenRequest')) },
            responses: {
                200: { description: 'Existing dialog reused', ...json(ref('ChatDialog')) },
                201: { description: 'New dialog created', ...json(ref('ChatDialog')) },
                400: { description: 'Missing shop_id/product_id for the given type' },
                404: { description: 'Shop or product not found' },
                429: { description: 'Too many new dialogs opened recently' },
            },
        },
    },

    '/buyer/chats/{id}/messages': {
        get: {
            tags: ['Buyer — Chats'],
            summary: 'Get messages in a dialog, newest page first (paginate backwards with `before`)',
            security: [{ bearerAuth: [] }],
            parameters: [
                { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                { in: 'query', name: 'before', schema: { type: 'string' }, description: 'From a previous response\'s next_cursor, to load older messages' },
                { in: 'query', name: 'limit', schema: { type: 'integer', default: 30 } },
            ],
            responses: {
                200: { description: 'Messages', ...json(ref('ChatMessageList')) },
                404: { description: 'Not a participant of this dialog' },
            },
        },
        post: {
            tags: ['Buyer — Chats'],
            summary: 'Send a message in a dialog',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            requestBody: { required: true, ...json(ref('ChatMessageCreate')) },
            responses: {
                201: { description: 'Sent', ...json(ref('ChatMessage')) },
                400: { description: 'Neither text nor attachment_url given' },
                404: { description: 'Not a participant of this dialog' },
                429: { description: 'Rate limit exceeded (20 messages/min)' },
            },
        },
    },

    '/buyer/chats/{id}/attachments': {
        post: {
            tags: ['Buyer — Chats'],
            summary: 'Upload one file (image/video/3d/360) to attach to a chat message',
            description: 'Returns a URL to pass as `attachment_url` in POST /buyer/chats/{id}/messages.',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            requestBody: {
                required: true,
                content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } } },
            },
            responses: {
                201: { description: 'Uploaded', ...json(ref('ChatAttachmentUpload')) },
                400: { description: 'No file, or unsupported file type' },
            },
        },
    },

    '/buyer/chats/{id}/read': {
        patch: {
            tags: ['Buyer — Chats'],
            summary: 'Mark messages in a dialog as read',
            security: [{ bearerAuth: [] }],
            parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
            requestBody: { required: false, ...json(ref('ChatMarkRead')) },
            responses: {
                204: { description: 'Marked as read' },
                404: { description: 'Not a participant of this dialog' },
            },
        },
    },
}
