const PanelChatService = require("../services/panel-chats");
const ApiError = require("../../../exceptions/api-error");

// Same controller for /seller/chat and /admin/chat — only the scope differs.
const sellerScope = (req) => ({ kind: "seller", userId: req.user.id, shopId: req.shop.id });
const adminScope  = (req) => ({ kind: "admin",  userId: req.user.id });

function build(getScope) {
    return {
        async list(req, res, next) {
            try {
                const { type, cursor, limit } = req.query;
                res.json(await PanelChatService.list(getScope(req), { type, cursor, limit }));
            } catch (e) { next(e); }
        },
        async getMessages(req, res, next) {
            try {
                const { before, limit } = req.query;
                res.json(await PanelChatService.getMessages(getScope(req), req.params.id, { before, limit }));
            } catch (e) { next(e); }
        },
        async postMessage(req, res, next) {
            try {
                const { text, attachment_url } = req.body || {};
                if (typeof text !== "string" && !attachment_url) throw ApiError.BadRequest("text ýa-da attachment_url talap edilýär");
                res.status(201).json(await PanelChatService.postMessage(getScope(req), req.params.id, { text, attachment_url }, req.app));
            } catch (e) { next(e); }
        },
        async markRead(req, res, next) {
            try {
                const upTo = req.body?.message_id ? Number(req.body.message_id) : undefined;
                await PanelChatService.markRead(getScope(req), req.params.id, upTo, req.app);
                res.json({ success: true });
            } catch (e) { next(e); }
        },
        async deleteMessage(req, res, next) {
            try {
                await PanelChatService.deleteMessage(getScope(req), req.params.id, req.params.messageId, req.app);
                res.json({ success: true });
            } catch (e) { next(e); }
        },
        async hideRoom(req, res, next) {
            try {
                await PanelChatService.hideRoom(getScope(req), req.params.id);
                res.json({ success: true });
            } catch (e) { next(e); }
        },
        async deleteRoom(req, res, next) {
            try {
                await PanelChatService.deleteRoom(getScope(req), req.params.id, req.app);
                res.json({ success: true });
            } catch (e) { next(e); }
        },
    };
}

module.exports = { seller: build(sellerScope), admin: build(adminScope) };
