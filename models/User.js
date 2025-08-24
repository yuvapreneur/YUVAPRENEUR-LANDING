const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  profession: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  password: { type: String, required: true },
  otp: { type: String },
  otpExpires: { type: Date },
  hasMainCourse: { type: Boolean, default: false },
  purchasedCourses: [{ type: String }],
  purchasedBonuses: [{ type: String }],
  bonuses: [{ 
    sku: String, 
    paymentId: String, 
    orderId: String, 
    purchasedAt: Date 
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
