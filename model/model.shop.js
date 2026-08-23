const mongoose = require("mongoose");


const shopSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  shopName: { type: String, required: true, trim: true },
  shopCategory: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model("shop", shopSchema);