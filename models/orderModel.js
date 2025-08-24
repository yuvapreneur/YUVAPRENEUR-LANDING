const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    itemId: String, // course ya bonus ka id
    type: String, // 'course' ya 'bonus'
    sku: String
  }],
  amount: Number,
  status: {
    type: String,
    default: 'pending' // pending / paid
  },
  paymentId: String,
  orderId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
