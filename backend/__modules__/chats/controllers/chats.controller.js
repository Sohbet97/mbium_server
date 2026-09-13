const ChatService = require("../services/chats");
const MediaService = require("../../media/services/media");
const ApiError = require("../../../exceptions/api-error");

class ChatController {
    static async listDialogs(req, res, next) {
        try {
            const { type, cursor, limit } = req.query;
            const result = await ChatService.listDialogs(req.user.id, { type, cursor, limit });
            return res.status(200).json(result);
        } catch (e) { next(e); }
    }

    static async openDialog(req, res, next) {
        try {
            const { type, shop_id, product_id, message } = req.body;
            const result = await ChatService.openOrCreateDialog({
                buyerId: req.user.id,
                type,
                shopId: shop_id,
                productId: product_id,
                firstMessageText: message,
            }, req.app);
            return res.status(result.is_new ? 201 : 200).json(result);
        } catch (e) { next(e); }
    }

    static async getMessages(req, res, next) {
        try {
            const { before, limit } = req.query;
            const result = await ChatService.getMessages(req.params.id, req.user.id, { before, limit });
            return res.status(200).json(result);
        } catch (e) { next(e); }
    }

    static async postMessage(req, res, next) {
        try {
            const { text, attachment_url } = req.body;
            const result = await ChatService.postMessage(req.params.id, req.user.id, { text, attachment_url }, req.app);
            return res.status(201).json(result);
        } catch (e) { next(e); }
    }

    static async uploadAttachment(req, res, next) {
        try {
            if (!req.file) throw ApiError.BadRequest("file talap edilýär");
            const media = await MediaService.processUpload(req.file, req.user.id);
            return res.status(201).json({ url: media.url, type: media.type, size: media.size });
        } catch (e) { next(e); }
    }

    static async markRead(req, res, next) {
        try {
            const { up_to_message_id } = req.body || {};
            await ChatService.markRead(req.params.id, req.user.id, up_to_message_id, req.app);
            return res.sendStatus(204);
        } catch (e) { next(e); }
    }
}

module.exports = ChatController;
