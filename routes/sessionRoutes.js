const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");


// create session router
router.post("/create-session", sessionController.createSession);


router.get("/user-all-session/:userId", sessionController.getUserAllSession);


module.exports = router;