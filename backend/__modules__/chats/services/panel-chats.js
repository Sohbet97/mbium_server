const { Op, QueryTypes } = require("sequelize");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");
const ChatService = require("./chats");
const Cursor = require("../utils/cursor");

// Seller / admin panel view of the same rooms the client app uses (chat_rooms, chat_messages).
//   type 20            shop dialog (product_id NULL) or product dialog (product_id set)
//   type 1             support: a seller <-> admin room
// scope = { kind: "seller", userId, shopId } | { kind: "admin", userId }
const ROOM_TYPE = { SUPPORT: 1, SHOP_DIALOG: 20 };
const NOT_FOUND = "Chat tapylmady";

const roomTypeName = (r) => (r.type === ROOM_TYPE.SUPPORT ? "support" : (r.product_id ? "product" : "shop"));

class PanelChatService {
    // Resolves a room the panel user may access, or throws 404 (never reveals other shops' rooms).
    // write = true additionally enforces who may reply.
    static async _getRoom(scope, roomId, { write = false } = {}) {
        const id = Number(roomId);
        if (!Number.isInteger(id) || id <= 0) throw ApiError.NotFound(NOT_FOUND);

        const room = await db.ChatRoom.findOne({
            where: { id, type: { [Op.in]: [ROOM_TYPE.SUPPORT, ROOM_TYPE.SHOP_DIALOG] } },
        });
        if (!room) throw ApiError.NotFound(NOT_FOUND);

        if (scope.kind === "seller") {
            if (room.type === ROOM_TYPE.SHOP_DIALOG) {
                if (Number(room.shop_id) !== Number(scope.shopId)) throw ApiError.NotFound(NOT_FOUND);
            } else {
                const own = await db.ChatRoomParticipant.findOne({ where: { chatroom_id: room.id, user_id: scope.userId, role: 1 } });
                if (!own) throw ApiError.NotFound(NOT_FOUND);
            }
        } else if (write && room.type !== ROOM_TYPE.SUPPORT) {
            // Admins read every dialog but only answer in support
            throw ApiError.NotAllowed("Admin diňe goldaw söhbetdeşliklerine jogap berip biler");
        }
        return room;
    }

    // Seller owns the shop, but only the participant rows decide who gets notified: keep them in sync
    static async _ensureParticipant(room, userId, role) {
        await db.ChatRoomParticipant.findOrCreate({
            where: { chatroom_id: room.id, user_id: userId },
            defaults: { role },
        });
    }

    static async list(scope, { type, cursor, limit = 20 } = {}) {
        limit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
        if (type && !["shop", "product", "support"].includes(type)) throw ApiError.BadRequest("type ýalňyş (shop / product / support)");

        const replacements = { userId: scope.userId, limit };
        const visible = [];

        if (scope.kind === "seller") {
            replacements.shopId = scope.shopId;
            visible.push(`(r.type = ${ROOM_TYPE.SHOP_DIALOG} AND r.shop_id = :shopId)`);
            visible.push(`(r.type = ${ROOM_TYPE.SUPPORT} AND EXISTS (
                SELECT 1 FROM chat_room_participants sp WHERE sp.chatroom_id = r.id AND sp.user_id = :userId AND sp.role = 1))`);
        } else {
            visible.push(`r.type IN (${ROOM_TYPE.SUPPORT}, ${ROOM_TYPE.SHOP_DIALOG})`);
        }
        const conditions = [`(${visible.join(" OR ")})`];

        if (type === "support") conditions.push(`r.type = ${ROOM_TYPE.SUPPORT}`);
        else if (type === "shop") conditions.push(`r.type = ${ROOM_TYPE.SHOP_DIALOG} AND r.product_id IS NULL`);
        else if (type === "product") conditions.push(`r.type = ${ROOM_TYPE.SHOP_DIALOG} AND r.product_id IS NOT NULL`);

        const decoded = Cursor.decode(cursor);
        if (decoded) {
            const [cUpdatedAt, cId] = decoded.split("|");
            if (cUpdatedAt && cId) {
                conditions.push(`(r."updatedAt", r.id) < (:cursorUpdatedAt::timestamptz, :cursorId::int)`);
                replacements.cursorUpdatedAt = cUpdatedAt;
                replacements.cursorId = parseInt(cId);
            }
        }

        // Unread = messages from the other side that this user has no read row for.
        // For admins on shop dialogs (which they only observe) that is meaningless, so 0.
        const unreadSql = scope.kind === "admin"
            ? `CASE WHEN r.type = ${ROOM_TYPE.SUPPORT} THEN (${this._unreadSubquery()}) ELSE 0 END`
            : `(${this._unreadSubquery()})`;

        const rows = await db.sequelize.query(
            `SELECT r.id, r.type, r.shop_id, r.product_id, r."updatedAt",
                    s.name AS shop_name, s.logo AS shop_logo,
                    p.name AS product_name,
                    cu.id AS customer_id, cu.name AS customer_name, cu.surname AS customer_surname, cu.phone_number AS customer_phone,
                    lm.text AS last_text, lm.file AS last_file, lm."createdBy" AS last_sender, lm."createdAt" AS last_sent_at,
                    ${unreadSql} AS unread_count
             FROM chat_rooms r
             LEFT JOIN shops s ON s.id = r.shop_id
             LEFT JOIN products p ON p.id = r.product_id
             LEFT JOIN LATERAL (
                SELECT u.id, u.name, u.surname, u.phone_number FROM users u
                WHERE u.id = CASE WHEN r.type = ${ROOM_TYPE.SUPPORT}
                                  THEN (SELECT cp.user_id FROM chat_room_participants cp WHERE cp.chatroom_id = r.id AND cp.role = 1 LIMIT 1)
                                  ELSE r."createdBy" END
             ) cu ON true
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
            type: roomTypeName(r),
            customer: r.customer_id ? { id: r.customer_id, name: r.customer_name, surname: r.customer_surname, phone_number: r.customer_phone } : null,
            shop: r.shop_id ? { id: r.shop_id, name: r.shop_name, logo: r.shop_logo } : null,
            product: r.product_id ? { id: r.product_id, name: r.product_name } : null,
            last_message: r.last_sent_at ? {
                text: r.last_text,
                attachment_url: r.last_file || null,
                is_mine: r.last_sender === scope.userId,
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

    static _unreadSubquery() {
        return `SELECT COUNT(*)::int FROM chat_messages m
                  WHERE m.chatroom_id = r.id AND m."createdBy" != :userId
                    AND NOT EXISTS (SELECT 1 FROM chat_message_reads rd WHERE rd.message_id = m.id AND rd.user_id = :userId)`;
    }

    static async getMessages(scope, roomId, { before, limit = 30 } = {}) {
        const room = await this._getRoom(scope, roomId);
        limit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);

        const where = { chatroom_id: room.id };
        const decoded = Cursor.decode(before);
        if (decoded && !isNaN(parseInt(decoded))) where.id = { [Op.lt]: parseInt(decoded) };

        const messages = await db.ChatMessage.findAll({
            where,
            include: [{ model: db.User, as: "sender", attributes: ["id", "name", "surname"] }],
            order: [["id", "DESC"]],
            limit,
        });

        const items = messages.reverse().map((m) => ({
            id: m.id,
            text: m.text,
            attachment_url: m.file || null,
            sender: m.sender ? { id: m.sender.id, name: m.sender.name, surname: m.sender.surname } : { id: m.createdBy },
            is_mine: m.createdBy === scope.userId,
            sent_at: m.createdAt,
        }));

        const next_cursor = messages.length === limit ? Cursor.encode(String(items[0].id)) : null;
        return { items, next_cursor };
    }

    static async postMessage(scope, roomId, { text, attachment_url } = {}, app = null) {
        const room = await this._getRoom(scope, roomId, { write: true });
        await this._ensureParticipant(room, scope.userId, 2);

        const message = await ChatService.postMessage(room.id, scope.userId, { text, attachment_url }, app);

        // The existing support drawers listen for this event instead of message.new
        if (room.type === ROOM_TYPE.SUPPORT && app?.io) {
            const others = await db.ChatRoomParticipant.findAll({ where: { chatroom_id: room.id, user_id: { [Op.ne]: scope.userId } } });
            others.forEach((p) => app.io.to(String(p.user_id)).emit("support-message", {
                id: message.id, chatroom_id: room.id, room_id: room.id, text: message.text, file: message.attachment_url,
                createdBy: scope.userId, createdAt: message.sent_at,
            }));
        }
        return message;
    }

    static async markRead(scope, roomId, upToMessageId, app = null) {
        const room = await this._getRoom(scope, roomId);
        // Observing admins have no participant row on shop dialogs, and don't produce read receipts there
        if (scope.kind === "admin" && room.type !== ROOM_TYPE.SUPPORT) return;
        await this._ensureParticipant(room, scope.userId, 2);
        await ChatService.markRead(room.id, scope.userId, upToMessageId, app);
    }
}

module.exports = PanelChatService;
