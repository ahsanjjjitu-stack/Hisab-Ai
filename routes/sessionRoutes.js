const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");


// create session router
router.post("/create-session", sessionController.createSession);

// get all session router
router.get("/user-all-session/:userId", sessionController.getUserAllSession);

// delete session router
router.delete("/delete-session/:sessionId/:userId", sessionController.deleteSession);


module.exports = router;