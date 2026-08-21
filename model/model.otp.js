const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true 
  },
  otp: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 300 // ৫ মিনিট (৩০০ সেকেন্ড) পর অটোমেটিক ডেটাবেজ থেকে মুছে যাবে
  }
});

module.exports = mongoose.model("otp", otpSchema);