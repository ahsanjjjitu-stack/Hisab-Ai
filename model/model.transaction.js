const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  rawMessage: {
    type: String, 
    required: true
  },
  transactionType: {
    type: String,
    enum: ['SALE', 'EXPENSE', 'DUE_PAYMENT', 'OTHER'],
    default: 'SALE'
  },
  itemName: { 
    type: String, 
    default: null 
  },
  quantity: { 
    type: Number, 
    default: 0 
  },
  unit: { 
    type: String, 
    default: null 
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'DUE', 'PARTIAL'],
    default: 'CASH'
  },
  paidAmount: { 
    type: Number, 
    default: 0 
  },
  dueAmount: { 
    type: Number, 
    default: 0 
  },
  customerName: { 
    type: String, 
    default: null 
  },
  customerPhone: { 
    type: String, 
    default: null 
  },
  summaryText: {
    type: String, 
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);