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
    return router;
};
