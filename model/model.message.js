const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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
    sender: {
        type: String,
        enum: ['USER', 'AI'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    }
}, {
    timestamps: true
});

messageSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);