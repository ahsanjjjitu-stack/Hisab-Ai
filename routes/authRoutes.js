const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");


// sent otp router
router.post("/send-otp", authController.sendOtp);

// verify otp router
router.post("/verify-otp", authController.verifyOtpAndRegister);

module.exports = router;