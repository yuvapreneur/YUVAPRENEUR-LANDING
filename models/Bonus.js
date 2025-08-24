const mongoose = require('mongoose');

const bonusSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  price: { type: Number, default: 0 },
  sku: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Bonus', bonusSchema);
