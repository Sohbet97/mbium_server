const json = (schema) => ({ content: { 'application/json': { schema } } })
const security = [{ BearerAuth: [] }]
const idParam = { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }

const user = { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, surname: { type: 'string' }, phone_number: { type: 'string' } } }
const dialog = {
    type: 'object',
    properties: {
        id:       { type: 'integer' },
        type:     { type: 'string', enum: ['shop', 'product', 'support'] },
        customer: { ...user, nullable: true, description: 'The buyer (shop/product dialogs) or the seller (support)' },
        shop:     { type: 'object', nullable: true, properties: { id: { type: 'integer' }, name: { type: 'string' }, logo: { type: 'string', nullable: true } } },
        product:  { type: 'object', nullable: true, properties: { id: { type: 'integer' }, name: { type: 'string' } } },
        last_message: { type: 'object', nullable: true, properties: { text: { type: 'string', nullable: true }, attachment_url: { type: 'string', nullable: true }, is_mine: { type: 'boolean' }, sent_at: { type: 'string', format: 'date-time' } } },
        unread_count: { type: 'integer' },
        updated_at:   { type: 'string', format: 'date-time' },
    },
}
const message = {
    type: 'object',
    properties: {
        id: { type: 'integer' }, text: { type: 'string', nullable: true }, attachment_url: { type: 'string', nullable: true },
        sender: { ...user, description: 'Who wrote it' }, is_mine: { type: 'boolean' }, sent_at: { type: 'string', format: 'date-time' },
    },
}
const dialogList  = { type: 'object', properties: { items: { type: 'array', items: dialog }, next_cursor: { type: 'string', nullable: true } } }
const messageList = { type: 'object', properties: { items: { type: 'array', items: message }, next_cursor: { type: 'string', nullable: true } } }

function paths(prefix, tag, who) {
    const base = `/${prefix}/chat`
    return {
        [base]: {
            get: {
                tags: [tag], summary: `List chats (${who})`, security,
                parameters: [
                    { in: 'query', name: 'type',   schema: { type: 'string', enum: ['shop', 'product', 'support'] }, description: 'shop = about the shop, product = about a product, support = seller ↔ admin' },
                    { in: 'query', name: 'cursor', schema: { type: 'string' }, description: 'next_cursor of the previous page' },
                    { in: 'query', name: 'limit',  schema: { type: 'integer', default: 20, maximum: 50 } },
                ],
                responses: { 200: { description: 'Chats, most recently active first', ...json(dialogList) }, 400: { description: 'Invalid type' } },
            },
        },
        [`${base}/{id}/messages`]: {
            get: {
                tags: [tag], summary: 'Messages of a chat, newest page first', security,
                parameters: [idParam,
                    { in: 'query', name: 'before', schema: { type: 'string' }, description: 'next_cursor, to load older messages' },
                    { in: 'query', name: 'limit',  schema: { type: 'integer', default: 30, maximum: 100 } },
                ],
                responses: { 200: { description: 'Messages (oldest first within the page)', ...json(messageList) }, 404: { description: 'Chat not found or not accessible' } },
            },
            post: {
                tags: [tag], summary: 'Reply in a chat', security,
                description: prefix === 'admin'
                    ? 'Admins can only reply in `support` chats; other chats are read-only (403).'
                    : 'Replies in the shop\'s shop/product chats and in the seller\'s own support chat. The buyer is notified (socket + push) like for any chat message.',
                parameters: [idParam],
                requestBody: { required: true, ...json({ type: 'object', properties: { text: { type: 'string' }, attachment_url: { type: 'string' } } }) },
                responses: { 201: { description: 'Sent', ...json(message) }, 400: { description: 'Neither text nor attachment_url' }, 403: { description: 'Read-only chat' }, 404: { description: 'Chat not found or not accessible' }, 429: { description: 'Rate limit' } },
            },
        },
        [`${base}/{id}/read`]: {
            put: {
                tags: [tag], summary: 'Mark messages as read', security,
                parameters: [idParam],
                requestBody: { required: false, ...json({ type: 'object', properties: { message_id: { type: 'integer', description: 'Mark up to this message; omit for all' } } }) },
                responses: { 200: { description: 'OK' }, 404: { description: 'Chat not found or not accessible' } },
            },
        },
        [`${base}/{id}/messages/{messageId}`]: {
            delete: {
                tags: [tag], summary: 'Delete a message', security,
                description: (prefix === 'admin'
                    ? 'Admins (CHAT_DELETE) can delete any message.'
                    : 'Sellers can only delete messages they sent (403 otherwise).')
                    + ' Other participants receive a `message.deleted` socket event `{ chat_id, message_id }`.',
                parameters: [idParam, { in: 'path', name: 'messageId', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Deleted' }, 403: { description: 'Not allowed' }, 404: { description: 'Chat or message not found' } },
            },
        },
        [`${base}/{id}`]: {
            delete: prefix === 'admin' ? {
                tags: [tag], summary: 'Delete a chat with all its messages', security,
                description: 'Requires CHAT_DELETE. Participants receive a `chat.deleted` socket event `{ chat_id }`.',
                parameters: [idParam],
                responses: { 200: { description: 'Deleted' }, 403: { description: 'Missing CHAT_DELETE' }, 404: { description: 'Chat not found' } },
            } : {
                tags: [tag], summary: 'Hide a buyer chat for this seller', security,
                description: 'Nothing is deleted: messages up to now are hidden for the calling seller only, and the buyer keeps the full history. ' +
                    'The chat reappears in the list (with only newer messages) when a new message arrives. Support chats cannot be hidden (400).',
                parameters: [idParam],
                responses: { 200: { description: 'Hidden' }, 400: { description: 'Support chat' }, 404: { description: 'Chat not found or not accessible' } },
            },
        },
    }
}

module.exports = {
    ...paths('seller', 'Seller — Chats', 'the active shop\'s dialogs + own support chat'),
    ...paths('admin',  'Admin — Chats',  'all shop/product dialogs and support chats'),
}
