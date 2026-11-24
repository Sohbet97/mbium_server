const express = require("express");
const controllers = require("../controllers/panel-chats.controller");

// kind = "seller" | "admin"
module.exports = (kind) => {
    const router = express.Router();
    const c = controllers[kind];
    router.get("/",              c.list);
    router.get("/:id/messages",  c.getMessages);
    router.post("/:id/messages", c.postMessage);
    router.put("/:id/read",      c.markRead);
    router.delete("/:id/messages/:messageId", c.deleteMessage);
    // Admins delete the room for everyone; sellers only hide it from their own list
    router.delete("/:id", kind === "admin" ? c.deleteRoom : c.hideRoom);
    return router;
};
