const express = require("express");
const router = express.Router();


const { getMessages, sendMessage, getAllMessages, getChatHistory,deleteMessage } = require("../controllers/chatController");
const { verifyToken } = require("../middleware/socketAuth");

router.get("/messages/:userId", verifyToken, getMessages); 
router.post("/messages", verifyToken, sendMessage);
router.get("/admin/messages", verifyToken, getAllMessages);
router.get("/history/:otherUserId", verifyToken, getChatHistory);
router.delete("/delete/:messageId", verifyToken, deleteMessage);
module.exports = router;
