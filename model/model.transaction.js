const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: null }, 
    unitPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
        index: true
    },
    transactionType: {
        type: String,
        enum: ['SALE', 'EXPENSE', 'DUE_COLLECTION'],
        required: true
    },
    items: [itemSchema],
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    dueAmount: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ['CASH', 'DUE', 'PARTIAL_DUE', 'DIGITAL'],
        default: 'CASH'
    },
    customer: {
        name: { type: String, default: null },
        phone: { type: String, default: null },
        address: { type: String, default: null }
    }
}, {
    timestamps: true
});

transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);