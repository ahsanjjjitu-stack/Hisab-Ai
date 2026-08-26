const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// get message and session item 
router.get("/get-message-and-session-list/:userId/:sessionId", messageController.getMessageAndSessionItem);

// post api message send 
router.post("/send-message", messageController.sendMessage);

module.exports = router;