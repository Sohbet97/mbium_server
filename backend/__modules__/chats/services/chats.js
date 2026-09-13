const { Op, QueryTypes } = require("sequelize");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");
const PushService = require("../../../services/push");
const Cursor = require("../utils/cursor");

// Buyer <-> shop dialogs live in the same chat_rooms/chat_messages schema as
// the existing seller<->admin support chat, distinguished by type = 20
// (support is type 1). A dialog is scoped per shop + product: two different
// products from the same shop are two different rooms.
const ROOM_TYPE = { SUPPORT: 1, SHOP_DIALOG: 20 };

// Antispam — DB-counter check, no new dependency (mirrors this codebase's
// existing style of inline guards rather than a rate-limit middleware).
const MESSAGE_RATE_LIMIT = { windowSeconds: 60, max: 20 };
const NEW_DIALOG_RATE_LIMIT = { windowSeconds: 3600, max: 10 };

class ChatService {
    static async _assertParticipant(roomId, userId) {
        const participant = await db.ChatRoomParticipant.findOne({ where: { chatroom_id: roomId, user_id: userId } });
        if (!participant) throw ApiError.NotFound("Chat tapylmady");
        return participant;
    }

    static async _assertMessageRate(userId, roomId) {
        const since = new Date(Date.now() - MESSAGE_RATE_LIMIT.windowSeconds * 1000);
        const count = await db.ChatMessage.count({ where: { createdBy: userId, chatroom_id: roomId, createdAt: { [Op.gte]: since } } });
        if (count >= MESSAGE_RATE_LIMIT.max) throw ApiError.TooManyRequests("Has köp habar iberdiňiz, biraz garaşyň");
    }

    static async _assertNewDialogRate(userId) {
        const since = new Date(Date.now() - NEW_DIALOG_RATE_LIMIT.windowSeconds * 1000);
        const count = await db.ChatRoom.count({ where: { createdBy: userId, type: ROOM_TYPE.SHOP_DIALOG, createdAt: { [Op.gte]: since } } });
        if (count >= NEW_DIALOG_RATE_LIMIT.max) throw ApiError.TooManyRequests("Has köp söhbetdeşlik açdyňyz, biraz garaşyň");
    }

    // Idempotent — a second call with the same buyer+shop(+product) returns the existing room.
    static async openOrCreateDialog({ buyerId, type, shopId, productId, firstMessageText }, app = null) {
        if (type === "support") {
            return this._openSupportDialog(buyerId, firstMessageText, app);
        }

        let resolvedShopId = shopId ? Number(shopId) : null;
        let resolvedProductId = productId ? Number(productId) : null;

        if (type === "product") {
            if (!resolvedProductId) throw ApiError.BadRequest("product_id talap edilýär");
            const product = await db.Product.findByPk(resolvedProductId, { attributes: ["id", "shop_id"] });
            if (!product) throw ApiError.NotFound("Haryt tapylmady");
            resolvedShopId = product.shop_id; // server determines the shop, not the client
        } else if (type === "shop") {
            if (!resolvedShopId) throw ApiError.BadRequest("shop_id talap edilýär");
        } else {
            throw ApiError.BadRequest("type ýalňyş (support / shop / product)");
        }

        const shop = await db.Shop.findByPk(resolvedShopId, { attributes: ["id", "owner_id"] });
        if (!shop) throw ApiError.NotFound("Dükan tapylmady");

        const productWhere = resolvedProductId ? resolvedProductId : { [Op.is]: null };
        let room = await db.ChatRoom.findOne({
            where: { type: ROOM_TYPE.SHOP_DIALOG, createdBy: buyerId, shop_id: resolvedShopId, product_id: productWhere },
        });
        let is_new = false;

        if (!room) {
            await this._assertNewDialogRate(buyerId);
            room = await db.ChatRoom.create({
                type: ROOM_TYPE.SHOP_DIALOG,
                createdBy: buyerId,
                shop_id: resolvedShopId,
                product_id: resolvedProductId,
                status: 0,
            });
            await db.ChatRoomParticipant.bulkCreate([
                { chatroom_id: room.id, user_id: buyerId, role: 1 },
                { chatroom_id: room.id, user_id: shop.owner_id, role: 2 },
            ], { ignoreDuplicates: true });
            is_new = true;
        }

        if (firstMessageText?.trim()) {
            await this.postMessage(room.id, buyerId, { text: firstMessageText.trim() }, app);
        }

        return { ...(await this._formatRoom(room.id, resolvedShopId, resolvedProductId)), is_new };
    }

    static async _openSupportDialog(userId, firstMessageText, app) {
        let participant = await db.ChatRoomParticipant.findOne({
            where: { user_id: userId },
            include: [{ model: db.ChatRoom, as: "room", where: { type: ROOM_TYPE.SUPPORT }, required: true }],
        });
        let room = participant?.room;
        let is_new = false;

        if (!room) {
            room = await db.ChatRoom.create({ name: "Support", type: ROOM_TYPE.SUPPORT, status: 0, createdBy: userId });
            await db.ChatRoomParticipant.create({ chatroom_id: room.id, user_id: userId, role: 1 });
            is_new = true;
        }

        if (firstMessageText?.trim()) {
            await this.postMessage(room.id, userId, { text: firstMessageText.trim() }, app);
        }

        return { id: room.id, type: "support", shop: null, product: null, is_new };
    }

    static async _formatRoom(roomId, shopId, productId) {
        const [shop, product] = await Promise.all([
            shopId ? db.Shop.findByPk(shopId, { attributes: ["id", "name", "logo"] }) : null,
            productId ? db.Product.findByPk(productId, { attributes: ["id", "name"] }) : null,
        ]);
        return {
            id: roomId,
            type: productId ? "product" : "shop",
            shop: shop ? { id: shop.id, name: shop.name, logo: shop.logo } : null,
            product: product ? { id: product.id, name: product.name } : null,
        };
    }

    static async listDialogs(userId, { type, cursor, limit = 20 } = {}) {
        limit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

        const conditions = ["cp.user_id = :userId"];
        const replacements = { userId, limit };

        if (type === "support") conditions.push(`r.type = ${ROOM_TYPE.SUPPORT}`);
        else if (type === "shop") conditions.push(`r.type = ${ROOM_TYPE.SHOP_DIALOG} AND r.product_id IS NULL`);
        else if (type === "product") conditions.push(`r.type = ${ROOM_TYPE.SHOP_DIALOG} AND r.product_id IS NOT NULL`);
        else conditions.push(`r.type IN (${ROOM_TYPE.SUPPORT}, ${ROOM_TYPE.SHOP_DIALOG})`);

        const decoded = Cursor.decode(cursor);
        if (decoded) {
            const [cUpdatedAt, cId] = decoded.split("|");
            if (cUpdatedAt && cId) {
                conditions.push(`(r."updatedAt", r.id) < (:cursorUpdatedAt::timestamptz, :cursorId::int)`);
                replacements.cursorUpdatedAt = cUpdatedAt;
                replacements.cursorId = parseInt(cId);
            }
        }

        const rows = await db.sequelize.query(
            `SELECT r.id, r.type, r.shop_id, r.product_id, r."updatedAt",
                    s.name AS shop_name, s.logo AS shop_logo,
                    p.name AS product_name, pmedia.url AS product_image,
                    lm.text AS last_text, lm.file AS last_file, lm."createdBy" AS last_sender, lm."createdAt" AS last_sent_at,
                    (SELECT COUNT(*)::int FROM chat_messages m
                       WHERE m.chatroom_id = r.id AND m."createdBy" != :userId
                         AND NOT EXISTS (SELECT 1 FROM chat_message_reads rd WHERE rd.message_id = m.id AND rd.user_id = :userId)
                    ) AS unread_count
             FROM chat_rooms r
             JOIN chat_room_participants cp ON cp.chatroom_id = r.id
             LEFT JOIN shops s ON s.id = r.shop_id
             LEFT JOIN products p ON p.id = r.product_id
             LEFT JOIN LATERAL (
                SELECT pm.url FROM product_media pmd
                JOIN media pm ON pm.id = pmd.media_id
                WHERE pmd.product_id = r.product_id AND pmd.role = 'primary' AND pmd.variant_id IS NULL
                LIMIT 1
             ) pmedia ON r.product_id IS NOT NULL
             LEFT JOIN LATERAL (
                SELECT text, file, "createdBy", "createdAt" FROM chat_messages m2
                WHERE m2.chatroom_id = r.id ORDER BY m2.id DESC LIMIT 1
             ) lm ON true
             WHERE ${conditions.join(" AND ")}
             ORDER BY r."updatedAt" DESC, r.id DESC
             LIMIT :limit`,
            { replacements, type: QueryTypes.SELECT }
        );

        const items = rows.map((r) => ({
            id: r.id,
            type: r.type === ROOM_TYPE.SUPPORT ? "support" : (r.product_id ? "product" : "shop"),
            shop: r.shop_id ? { id: r.shop_id, name: r.shop_name, logo: r.shop_logo } : null,
            product: r.product_id ? { id: r.product_id, name: r.product_name, image: r.product_image || null } : null,
            last_message: r.last_sent_at ? {
                text: r.last_text,
                attachment_url: r.last_file || null,
                is_mine: r.last_sender === userId,
                sent_at: r.last_sent_at,
            } : null,
            unread_count: r.unread_count,
            updated_at: r.updatedAt,
        }));

        const last = rows[rows.length - 1];
        const next_cursor = rows.length === limit && last
            ? Cursor.encode(`${new Date(last.updatedAt).toISOString()}|${last.id}`)
            : null;

        return { items, next_cursor };
    }

    static async getMessages(roomId, userId, { before, limit = 30 } = {}) {
        await this._assertParticipant(roomId, userId);
        limit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);

        const where = { chatroom_id: roomId };
        const decoded = Cursor.decode(before);
        if (decoded && !isNaN(parseInt(decoded))) {
            where.id = { [Op.lt]: parseInt(decoded) };
        }

        const messages = await db.ChatMessage.findAll({
            where,
            include: [{ model: db.ChatMessageRead, as: "reads", where: { user_id: userId }, required: false }],
            order: [["id", "DESC"]],
            limit,
        });

        const items = messages.reverse().map((m) => ({
            id: m.id,
            text: m.text,
            attachment_url: m.file || null,
            is_mine: m.createdBy === userId,
            sent_at: m.createdAt,
            status: m.reads?.length ? "read" : (m.status === 1 ? "delivered" : "sent"),
        }));

        const next_cursor = messages.length === limit ? Cursor.encode(String(messages[0].id)) : null;
        return { items, next_cursor };
    }

    static async postMessage(roomId, userId, { text, attachment_url } = {}, app = null) {
        if (!text?.trim() && !attachment_url) throw ApiError.BadRequest("text ýa-da attachment_url talap edilýär");
        await this._assertParticipant(roomId, userId);
        await this._assertMessageRate(userId, roomId);

        const message = await db.ChatMessage.create({
            chatroom_id: roomId,
            text: text?.trim() || null,
            file: attachment_url || null,
            createdBy: userId,
        });
        // Sequelize's bulk update() no-ops when the only field given is the
        // auto-managed updatedAt attribute, so this needs a raw touch.
        await db.sequelize.query('UPDATE chat_rooms SET "updatedAt" = NOW() WHERE id = :id', { replacements: { id: roomId } });

        const others = await db.ChatRoomParticipant.findAll({ where: { chatroom_id: roomId, user_id: { [Op.ne]: userId } } });
        this._notifyNewMessage(roomId, message, others, app).catch(() => {});

        return {
            id: message.id,
            text: message.text,
            attachment_url: message.file,
            is_mine: true,
            sent_at: message.createdAt,
            status: "sent",
        };
    }

    static async _notifyNewMessage(roomId, message, participants, app) {
        for (const p of participants) {
            app?.io?.to(String(p.user_id)).emit("message.new", {
                chat_id: roomId,
                message: {
                    id: message.id,
                    text: message.text,
                    attachment_url: message.file,
                    sent_at: message.createdAt,
                },
            });
            const isOnline = app?.onlineUsers && app.onlineUsers[p.user_id];
            if (!isOnline) {
                await PushService.notifyUser(
                    p.user_id,
                    "Täze habar",
                    message.text || "Surat/faýl iberildi",
                    { type: "CHAT_MESSAGE", chat_id: String(roomId) }
                ).catch(() => {});
            }
        }
    }

    static async markRead(roomId, userId, upToMessageId, app = null) {
        await this._assertParticipant(roomId, userId);

        const where = { chatroom_id: roomId, createdBy: { [Op.ne]: userId } };
        if (upToMessageId) where.id = { [Op.lte]: upToMessageId };
        const messages = await db.ChatMessage.findAll({ where, attributes: ["id"] });
        if (!messages.length) return;

        await db.ChatMessageRead.bulkCreate(
            messages.map((m) => ({ message_id: m.id, user_id: userId })),
            { ignoreDuplicates: true }
        );

        const others = await db.ChatRoomParticipant.findAll({ where: { chatroom_id: roomId, user_id: { [Op.ne]: userId } } });
        others.forEach((p) => {
            app?.io?.to(String(p.user_id)).emit("message.read", {
                chat_id: roomId,
                message_id: messages[messages.length - 1].id,
                read_by: userId,
            });
        });
    }
}

module.exports = ChatService;
