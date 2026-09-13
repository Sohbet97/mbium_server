const router = require("express").Router();
const ChatController = require("../controllers/chats.controller");
const { mediaUpload } = require("../../../utils/upload");

router.get("/",                 ChatController.listDialogs);
router.post("/",                ChatController.openDialog);
router.get("/:id/messages",     ChatController.getMessages);
router.post("/:id/attachments", mediaUpload.single("file"), ChatController.uploadAttachment);
router.post("/:id/messages",    ChatController.postMessage);
router.patch("/:id/read",       ChatController.markRead);

module.exports = router;
